"""Classic EOF analysis of tropical-Pacific SST using NOAA ERSST v5.

The script downloads a fixed 1982-2023 monthly subset through OPeNDAP,
removes the 1991-2020 monthly climatology, detrends each grid point, applies
sqrt(cos(latitude)) area weighting, and calculates EOFs with SVD.
"""

import numpy as np
import xarray as xr
import matplotlib.pyplot as plt

DATA_URL = "https://psl.noaa.gov/thredds/dodsC/Datasets/noaa.ersst.v5/sst.mnmean.nc"

# A fixed analysis period makes the result reproducible. The selected domain
# contains the canonical ENSO pattern without downloading the full 160 MB file.
sst = (
    xr.open_dataset(DATA_URL)["sst"]
    # ERSST latitude is stored north-to-south, so the slice is 20 to -20.
    .sel(time=slice("1982-01-01", "2023-12-31"), lat=slice(20, -20), lon=slice(120, 280))
    .load()
)

# Remove the seasonal cycle using a standard 30-year climatology.
clim = sst.sel(time=slice("1991-01-01", "2020-12-31")).groupby("time.month").mean("time")
anom = sst.groupby("time.month") - clim

# Area weighting makes the Euclidean covariance approximate an area integral.
weights = np.sqrt(np.cos(np.deg2rad(anom.lat)))
weighted = (anom * weights).stack(space=("lat", "lon")).dropna("space")
X = weighted.values

# Remove a linear trend independently at every valid grid point.
t = np.arange(X.shape[0], dtype=float)
slope, intercept = np.polyfit(t, X, 1)
X = X - (t[:, None] * slope[None, :] + intercept[None, :])

# X(time, space) = U S V^T. PCs carry temporal amplitude; EOFs are spatial modes.
U, singular_values, Vt = np.linalg.svd(X, full_matrices=False)
variance_fraction = singular_values**2 / np.sum(singular_values**2)
pc1 = U[:, 0] * singular_values[0]

# Undo latitude weighting and scale the EOF to the SST anomaly associated with
# one standard deviation of PC1.
space_lat = weighted["lat"].values
eof1_values = Vt[0] / np.sqrt(np.cos(np.deg2rad(space_lat)))
pc1_std = np.std(pc1)
eof1_values *= pc1_std
pc1 /= pc1_std
eof1 = xr.DataArray(
    eof1_values, coords={"space": weighted.space}, dims="space", name="EOF1"
).unstack("space")

# EOF sign is arbitrary. Orient EOF1 so the Niño-3.4 mean is positive.
nino34 = eof1.sel(lat=slice(5, -5), lon=slice(190, 240)).mean().item()
if nino34 < 0:
    eof1 = -eof1
    pc1 = -pc1

fig, axes = plt.subplots(2, 1, figsize=(11, 7), constrained_layout=True)
eof1.plot.contourf(ax=axes[0], levels=17, cmap="RdBu_r", center=0)
axes[0].set_title(f"ERSSTv5 tropical-Pacific EOF1 ({variance_fraction[0]*100:.1f}% variance)")
axes[0].set_xlabel("Longitude (°E)")
axes[0].set_ylabel("Latitude (°N)")
axes[1].plot(anom.time, pc1, color="#0b6670", linewidth=0.9)
axes[1].axhline(0, color="0.4", linewidth=0.7)
axes[1].set_title("Normalized principal component PC1")
axes[1].set_ylabel("Standard deviations")
axes[1].set_xlabel("Time")
fig.savefig("eof1_ersstv5.png", dpi=180)

eof1.to_netcdf("eof1_ersstv5.nc")
print(f"EOF1 explained variance: {variance_fraction[0]*100:.2f}%")

