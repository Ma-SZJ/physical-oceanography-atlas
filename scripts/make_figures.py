# -*- coding: utf-8 -*-
"""Generate real-data figures for the physical-oceanography-atlas site.

Data source: NOAA WOA23 (1-degree, decadal average), annual (00) and February (01)
temperature & salinity, read via NCEI THREDDS OPeNDAP (flat-file downloads are
geo-blocked from some networks).

Requirements: numpy, xarray, netcdf4, gsw, cartopy, matplotlib.

Run from anywhere:  python scripts/make_figures.py
Outputs (PNG) go to the repo's dist/assets/figures/ directory. The downloaded
T/S fields are cached in the system temp directory, so re-runs are fast and
need no network access.
"""
import os
import tempfile
import numpy as np
import xarray as xr
import gsw
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import BoundaryNorm

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(REPO, "dist", "assets", "figures")
os.makedirs(OUT, exist_ok=True)

BASE = "https://www.ncei.noaa.gov/thredds-ocean/dodsC/woa23/DATA"
FILES = {
    "t_ann": f"{BASE}/temperature/netcdf/decav/1.00/woa23_decav_t00_01.nc",
    "s_ann": f"{BASE}/salinity/netcdf/decav/1.00/woa23_decav_s00_01.nc",
    "t_feb": f"{BASE}/temperature/netcdf/decav/1.00/woa23_decav_t01_01.nc",
    "s_feb": f"{BASE}/salinity/netcdf/decav/1.00/woa23_decav_s01_01.nc",
}

plt.rcParams.update({
    "font.size": 9.5,
    "axes.titlesize": 11,
    "axes.titleweight": "bold",
    "figure.facecolor": "white",
    "axes.facecolor": "white",
    "savefig.facecolor": "white",
})

OMEGA = 7.2921e-5
R_EARTH = 6.371e6
G = 9.7964  # m/s2, standard gravity of the dynamic method


def load(name):
    ds = xr.open_dataset(FILES[name], decode_times=False, decode_timedelta=False)
    var = [v for v in ds.data_vars if v.endswith("_an")][0]
    da = ds[var]
    # WOA longitude is 0.5..359.5 -> shift to -180..180 for plotting
    da = da.assign_coords(lon=((da.lon + 180) % 360) - 180).sortby("lon")
    vals = np.squeeze(da.values.astype(float))          # (depth, lat, lon)
    lat = da.lat.values.astype(float)
    lon = da.lon.values.astype(float)
    depth = da.depth.values.astype(float)
    ds.close()
    return vals, lat, lon, depth


CACHE = os.path.join(tempfile.gettempdir(), "woa23_climatology_cache.npz")


def load_cached():
    if os.path.exists(CACHE):
        z = np.load(CACHE)
        return z["t_ann"], z["s_ann"], z["t_feb"], z["s_feb"], z["lat"], z["lon"], z["depth"], z["depth_f"]
    print("downloading via OPeNDAP ...", flush=True)
    t_ann, lat, lon, depth = load("t_ann")
    s_ann, *_ = load("s_ann")
    t_feb, _, _, depth_f = load("t_feb")
    s_feb, *_ = load("s_feb")
    np.savez_compressed(CACHE, t_ann=t_ann, s_ann=s_ann, t_feb=t_feb, s_feb=s_feb,
                        lat=lat, lon=lon, depth=depth, depth_f=depth_f)
    return t_ann, s_ann, t_feb, s_feb, lat, lon, depth, depth_f


def land_coast(ax, mask2d, color="#9aa8a4", lw=0.6):
    """Draw coastlines from the WOA land mask (NaN = land)."""
    land = np.ma.masked_invalid(mask2d)
    ax.contour(lon, lat, land.filled(-1) >= 0, levels=[0.5],
               colors=color, linewidths=lw)


def tidy(ax):
    ax.set_xlim(-180, 180)
    ax.set_ylim(-90, 90)
    ax.set_xticks(np.arange(-180, 181, 60))
    ax.set_yticks(np.arange(-60, 61, 30))
    ax.set_xticklabels(["180°", "120°W", "60°W", "0°", "60°E", "120°E", "180°"])
    ax.set_yticklabels(["60°S", "30°S", "0°", "30°N", "60°N"])
    ax.tick_params(length=2, pad=2)


# ----------------------------------------------------------------- load data
t_ann, s_ann, t_feb, s_feb, lat, lon, depth, depth_f = load_cached()
print("shapes:", t_ann.shape, s_feb.shape, flush=True)

lat_a2 = lat[None, :, None]
lon_a2 = lon[None, None, :]


def ct_sigma(T, S, depth, lat2, lon2):
    p = gsw.p_from_z(-depth[:, None, None], lat2)       # (nz,1,1) broadcast
    SA = gsw.SA_from_SP(S, p, lon2, lat2)
    CT = gsw.CT_from_t(SA, T, p)
    sig0 = gsw.sigma0(SA, CT)
    rho = gsw.rho(SA, CT, p)
    return SA, CT, sig0, rho, p


print("computing annual sigma/density ...", flush=True)
SA_a, CT_a, sig0_a, rho_a, p_a = ct_sigma(t_ann, s_ann, depth, lat_a2, lon_a2)
sig0_surf = sig0_a[0]

print("computing February sigma ...", flush=True)
_, _, sig0_f, _, _ = ct_sigma(t_feb, s_feb, depth_f, lat_a2, lon_a2)

# ---------------------------------------------------- A1: SST / SSS / density
print("figure A1: SST, SSS, surface density", flush=True)
fig, axes = plt.subplots(3, 1, figsize=(11.0, 8.6), constrained_layout=True)
specs = [
    (t_ann[0], "RdYlBu_r", (-2, 32), "Annual mean sea-surface temperature (°C)",
     "WOA23 · 1° annual climatology"),
    (s_ann[0], "viridis", (30.5, 37.6), "Annual mean sea-surface salinity (PSU)",
     "WOA23 · 1° annual climatology"),
    (sig0_surf, "magma", (21.5, 28.1), "Annual mean surface potential density anomaly σ$_0$ (kg m$^{-3}$)",
     "computed from WOA23 T & S with TEOS-10 (gsw)"),
]
for ax, (fld, cmap, lim, title, sub) in zip(axes, specs):
    pc = ax.pcolormesh(lon, lat, fld, cmap=cmap, vmin=lim[0], vmax=lim[1],
                       shading="auto", rasterized=True)
    land_coast(ax, fld)
    tidy(ax)
    ax.set_title(title, loc="left")
    ax.text(0.998, 1.02, sub, transform=ax.transAxes, ha="right", va="bottom",
            fontsize=7.5, color="#5a6a68")
    cb = fig.colorbar(pc, ax=ax, pad=0.008, aspect=28)
    cb.ax.tick_params(labelsize=8)
fig.savefig(os.path.join(OUT, "test1-sst-sss-density.png"), dpi=150)
plt.close(fig)

# ------------------------------------------------------------- A2: profiles
print("figure A2: subtropical vs subpolar profiles", flush=True)
stas = {
    "Subtropical N. Pacific (30°N, 165°E)": (30.0, 165.0, "#d95f02"),
    "Subpolar N. Pacific (50°N, 165°E)": (50.0, 165.0, "#3b6fb6"),
}
zmax = 1000.0
zz = depth[depth <= zmax]
k = len(zz)
fig, axes = plt.subplots(1, 3, figsize=(10.6, 4.6), sharey=True, constrained_layout=True)
for name, (la, lo, color) in stas.items():
    j = int(np.argmin(np.abs(lat - la)))
    i = int(np.argmin(np.abs(lon - lo)))
    axes[0].plot(t_ann[:k, j, i], zz, color=color, lw=2, label=name)
    axes[1].plot(s_ann[:k, j, i], zz, color=color, lw=2)
    axes[2].plot(sig0_a[:k, j, i], zz, color=color, lw=2)
titles = ["In-situ temperature (°C)", "Salinity", "Potential density anomaly σ$_0$ (kg m$^{-3}$)"]
for ax, ti in zip(axes, titles):
    ax.invert_yaxis()
    ax.set_title(ti)
    ax.grid(alpha=0.3, lw=0.5)
    ax.set_ylim(zmax, 0)
axes[0].set_ylabel("Depth (m)")
axes[0].legend(fontsize=8, loc="lower left")
fig.suptitle("Upper-ocean vertical structure — WOA23 annual climatology", fontsize=12,
             fontweight="bold")
fig.savefig(os.path.join(OUT, "test1-profiles.png"), dpi=150)
plt.close(fig)

# ------------------------------------------------------------ A3: Feb MLD
print("figure A3: February mixed-layer depth (convection)", flush=True)
sig10 = sig0_f[np.argmin(np.abs(depth_f - 10))]
exc = (sig0_f - sig10[None, :, :]) > 0.03
first = np.argmax(exc, axis=0)
has_exc = exc.any(axis=0)
mld = np.where(has_exc, depth_f[np.minimum(first, len(depth_f) - 1)], depth_f[-1])
mld = np.where(np.isnan(sig10), np.nan, mld)
print("  MLD range:", np.nanmin(mld), np.nanmax(mld), flush=True)

levels = [10, 20, 40, 60, 80, 100, 150, 200, 300, 500, 750, 1000, 1500, 4000]
cmap_m = plt.get_cmap("YlGnBu", len(levels) - 1)
norm = BoundaryNorm(levels, cmap_m.N)
fig, ax = plt.subplots(figsize=(11.0, 4.4), constrained_layout=True)
pc = ax.pcolormesh(lon, lat, mld, cmap=cmap_m, norm=norm, shading="auto", rasterized=True)
land_coast(ax, mld)
tidy(ax)
ax.set_title("February mixed-layer depth — deep winter convection (Labrador, Nordic seas, Southern Ocean)",
             loc="left")
ax.text(0.998, 1.02, "WOA23 February · Δσ$_0$ = 0.03 kg m$^{-3}$ vs 10 m", transform=ax.transAxes,
        ha="right", va="bottom", fontsize=7.5, color="#5a6a68")
cb = fig.colorbar(pc, ax=ax, pad=0.008, aspect=30, ticks=levels)
cb.set_label("m", fontsize=8)
cb.ax.tick_params(labelsize=7.5)
fig.savefig(os.path.join(OUT, "test1-mld-feb.png"), dpi=150)
plt.close(fig)

# ------------------------------------------- B1: dynamic height + geostrophy
print("figure B1: dynamic height & surface geostrophic currents", flush=True)
v_sp = 1.0 / rho_a                                            # specific volume
v_std = 1.0 / gsw.rho(np.full_like(SA_a, 35.0), np.zeros_like(SA_a), p_a)
delta = v_sp - v_std                                          # specific volume anomaly
# fill below-bottom NaN with the deepest valid value (classic extrapolation)
delta_filled = np.where(np.isnan(delta), 0.0, delta)
for n in range(delta.shape[1]):
    for m in range(delta.shape[2]):
        col = delta[:, n, m]
        bad = np.isnan(col)
        if bad.any() and not bad.all():
            last = np.max(np.where(~bad))
            delta_filled[last + 1:, n, m] = col[last]

k_ref = int(np.argmin(np.abs(depth - 1500)))                  # reference level 1500 m
# geopotential anomaly: Phi = 1e4 * int(delta dp); dynamic height eta = Phi / g
Phi = 1e4 * np.concatenate(
    [np.zeros((1,) + delta_filled.shape[1:]),
     np.cumsum(0.5 * (delta_filled[1:] + delta_filled[:-1]) * np.diff(p_a, axis=0), axis=0)],
    axis=0)
eta = Phi[k_ref] / G
# keep only columns that actually reach the reference level; mask the Black Sea
# (fresh semi-enclosed basin, steric height ~16 m would wreck the oceanic scale)
valid_ref = ~np.isnan(t_ann[k_ref])
black_sea = ((lat[:, None] >= 40) & (lat[:, None] <= 48) &
             (lon[None, :] >= 27) & (lon[None, :] <= 42))
eta = np.where(valid_ref & ~black_sea, eta, np.nan)
eta = np.where(np.isnan(t_ann[0]), np.nan, eta)
print("  eta range:", np.nanmin(eta), np.nanmax(eta), flush=True)

f = 2.0 * OMEGA * np.sin(np.deg2rad(lat))[:, None] * np.ones((1, len(lon)))
deta_dphi = np.gradient(eta, np.deg2rad(lat), axis=0)          # per radian
deta_dlam = np.gradient(eta, np.deg2rad(lon), axis=1)          # per radian
cosphi = np.cos(np.deg2rad(lat))[:, None]
u_g = -(G / f) * deta_dphi / R_EARTH                           # dv/dt balance
v_g = (G / f) * deta_dlam / (R_EARTH * cosphi)
speed = np.hypot(u_g, v_g)
mask = (np.abs(lat)[:, None] >= 5) & ~np.isnan(eta)
u_g[~mask] = np.nan
v_g[~mask] = np.nan
print("  max speed:", np.nanmax(speed), flush=True)

fig, ax = plt.subplots(figsize=(11.0, 4.9), constrained_layout=True)
pc = ax.pcolormesh(lon, lat, eta, cmap="RdYlBu_r", vmin=-0.5, vmax=2.5,
                   shading="auto", rasterized=True)
land_coast(ax, eta, color="#4a5a57", lw=0.5)
ax.contour(lon, lat, eta, levels=[0.0, 0.5, 1.0, 1.5, 2.0], colors="white",
           linewidths=0.5, alpha=0.55)
gslon, gslat = np.meshgrid(lon, lat)
sub = (slice(None, None, 4), slice(None, None, 6))
qk = ax.quiver(gslon[sub], gslat[sub], u_g[sub], v_g[sub],
               color="#12333b", scale=10, width=0.0022, headwidth=3.2, headlength=3.6, zorder=5)
ax.quiverkey(qk, 0.115, 1.055, 0.5, "0.5 m s$^{-1}$", labelpos="E", coordinates="axes",
             fontproperties={"size": 8.5})
tidy(ax)
ax.set_title("Surface dynamic height & geostrophic current (ref. 1500 dbar)", loc="left")
ax.text(0.998, 1.02, "WOA23 annual T & S · |φ| < 5°, shallow seas & Black Sea masked",
        transform=ax.transAxes, ha="right", va="bottom", fontsize=7.5, color="#5a6a68")
cb = fig.colorbar(pc, ax=ax, pad=0.008, aspect=30)
cb.set_label("dynamic height (m)", fontsize=8.5)
cb.ax.tick_params(labelsize=8)
fig.savefig(os.path.join(OUT, "geo-dynamic-height-currents.png"), dpi=150)
plt.close(fig)

# ------------------------------------------------ B2: isopycnal section 165E
print("figure B2: Pacific sigma-theta section along 165°E", flush=True)
jlon = int(np.argmin(np.abs(lon - 165.0)))
sec = sig0_a[:, :, jlon]
sec = np.where(sec <= 1000, sec, np.nan)      # mask deep potential-density inversions
fig, ax = plt.subplots(figsize=(10.6, 4.4), constrained_layout=True)
pc = ax.pcolormesh(lat, depth, sec, cmap="viridis", vmin=21.5, vmax=28.05,
                   shading="auto", rasterized=True)
cl = ax.contour(lat, depth, sec, levels=np.arange(22.0, 27.6, 0.5), colors="white", linewidths=0.7)
ax.clabel(cl, fmt="%.1f", fontsize=7)
ax.invert_yaxis()
ax.set_ylim(1000, 0)
ax.set_xlim(-62, 62)
ax.set_xticks(np.arange(-60, 61, 20))
ax.set_xticklabels(["60°S", "40°S", "20°S", "0°", "20°N", "40°N", "60°N"])
ax.set_xlabel("Latitude along 165°E")
ax.set_ylabel("Depth (m)")
ax.set_title("Pacific potential density section (σ$_0$, kg m$^{-3}$) — sloping isopycnals balance geostrophic shear",
             loc="left")
ax.text(0.998, 1.02, "WOA23 annual · TEOS-10", transform=ax.transAxes, ha="right",
        va="bottom", fontsize=7.5, color="#5a6a68")
cb = fig.colorbar(pc, ax=ax, pad=0.008, aspect=30)
cb.ax.tick_params(labelsize=8)
fig.savefig(os.path.join(OUT, "geo-isopycnal-section.png"), dpi=150)
plt.close(fig)

print("done ->", OUT)
for fn in sorted(os.listdir(OUT)):
    print("  ", fn, os.path.getsize(os.path.join(OUT, fn)) // 1024, "KB")
