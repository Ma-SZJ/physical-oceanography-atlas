%% T_TIDE harmonic analysis of verified hourly water level
% Dataset: NOAA CO-OPS station 1612340 (Honolulu), 2023, MSL datum, UTC
% Toolbox: T_TIDE v1.5beta by Rich Pawlowicz et al.
% Before running, download T_TIDE and add its folder to the MATLAB path:
% https://www.eoas.ubc.ca/~rich/t_tide/t_tide_v1.5beta.zip

clear; close all; clc;

station = "1612340";
latitude = 21.30669;
dataUrl = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter" + ...
    "?product=hourly_height&application=physical_oceanography_atlas" + ...
    "&begin_date=20230101&end_date=20231231&datum=MSL" + ...
    "&station=" + station + "&time_zone=gmt&units=metric&format=csv";

csvFile = fullfile(tempdir, "honolulu_1612340_hourly_2023.csv");
websave(csvFile, dataUrl);

opts = detectImportOptions(csvFile, "VariableNamingRule", "preserve");
T = readtable(csvFile, opts);
time = datetime(string(T{:,1}), "InputFormat", "yyyy-MM-dd HH:mm", ...
    "TimeZone", "UTC");
waterLevel = double(T{:,2});

% Put observations on a regular hourly axis. T_TIDE ignores NaN gaps;
% do not interpolate long gaps because that would create artificial tides.
TT = timetable(time, waterLevel);
TT = sortrows(TT);
TT = retime(TT, "hourly", "mean");
missingFraction = mean(ismissing(TT.waterLevel));
fprintf("Samples: %d; missing: %.2f%%\n", height(TT), 100*missingFraction);
if missingFraction > 0.05
    warning("More than 5%% of the record is missing; inspect data quality first.");
end

startTime = datevec(TT.time(1));
[nameu, fu, tidecon, xout] = t_tide(TT.waterLevel, ...
    "interval", 1, ...             % sampling interval: 1 hour
    "start time", startTime, ...   % UTC start time
    "latitude", latitude, ...      % enables latitude-dependent corrections
    "output", "screen");

% tidecon columns: amplitude, amplitude error, phase, phase error.
constituents = strtrim(string(nameu));
result = table(constituents, tidecon(:,1), tidecon(:,2), ...
    tidecon(:,3), tidecon(:,4), ...
    "VariableNames", {"Constituent","Amplitude_m","AmpError_m", ...
    "Phase_deg","PhaseError_deg"});
result = sortrows(result, "Amplitude_m", "descend");
disp(result(1:min(12,height(result)),:));
writetable(result, "honolulu_ttide_constituents.csv");

residual = TT.waterLevel - xout;
figure("Color", "w", "Position", [100 100 1100 650]);
tiledlayout(2,1, "TileSpacing", "compact");
nexttile;
plot(TT.time, TT.waterLevel, "Color", [0.15 0.35 0.55]); hold on;
plot(TT.time, xout, "Color", [0.90 0.35 0.15], "LineWidth", 1.1);
xlim([TT.time(1), TT.time(1)+days(14)]); grid on;
ylabel("Water level (m, MSL)");
legend("Observed", "T_TIDE reconstruction", "Location", "best");
title("Honolulu verified hourly water level: first 14 days");
nexttile;
plot(TT.time, residual, "Color", [0.18 0.55 0.45]); grid on;
ylabel("Residual (m)"); xlabel("UTC time");
title("Non-tidal residual = observed - harmonic reconstruction");
exportgraphics(gcf, "honolulu_ttide_result.png", "Resolution", 180);


