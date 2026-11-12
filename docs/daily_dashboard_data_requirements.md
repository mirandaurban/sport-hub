# Daily Dashboard Data Requirements

Status: requirements only. Based on `garmin_data_inventory.md` and `data_contract.md`. Nothing here is implemented.

## Status legend

| Code | Meaning |
|---|---|
| **D** | Directly available from Garmin (one field, no transform) |
| **T** | Requires transformation (unit change, arithmetic on one day's data) |
| **H** | Requires historical aggregation (multiple days, windows, EWMA) |
| **U** | Requires additional user input (choice, goal, parameter) |
| **X** | Not currently available in the sampled endpoints |

A metric can carry several codes. Each row names its source fields and endpoints. "Unit TBD" means the field is confirmed to exist but its unit is not yet verified (see `data_contract.md` section 6).

---

## 1. Daily training status

No sampled endpoint returns a Garmin training status label. Nearest available inputs are per-activity load and training effect. Garmin's own status logic is undocumented, so it must not be reproduced.

| Element | Source | Status | Notes |
|---|---|---|---|
| Garmin training status label | — | **X** | No field in any sample. Would need a new endpoint probe. |
| Today's training load | E01/E03 `activityTrainingLoad` per activity, summed per date | **T H** | Sum is a transform; per-day grouping needs activity date rule (`startTimeLocal`). Scale TBD. |
| Today's aerobic / anaerobic effect | E01/E03 `aerobicTrainingEffect`, `anaerobicTrainingEffect`, `trainingEffectLabel` | **D** | Per activity. Scale TBD. |
| Today's intensity minutes | E17 `moderateIntensityMinutes`, `vigorousIntensityMinutes`, `intensityMinutesGoal` | **D** | Direct daily totals. |
| Body Battery at wake | E17 `bodyBatteryAtWakeTime` | **D** | Scale TBD. |
| Readiness-style summary | Combination of HRV status (E09 `status`), sleep score (E12), Body Battery | **T U** | Combining rules are not defined. User must choose inputs and rules. |

Missing for a true training-status view: Garmin status endpoint probe (**X**), and a defined load-status rule (**U**).

---

## 2. HRV and personal baseline

| Element | Source | Status | Notes |
|---|---|---|---|
| Last-night HRV average | E09/E10 `hrvSummary.lastNightAvg` | **D** | Unit TBD. |
| Weekly HRV average | E09/E10 `hrvSummary.weeklyAvg` | **D** | Unit TBD. |
| Last-night 5-min high | E09/E10 `lastNight5MinHigh` | **D** | |
| Baseline band (low, balanced low/upper) | E09/E10 `hrvSummary.baseline.{lowUpper, balancedLow, balancedUpper, markerValue}` | **D** | Whether this is a *personal* baseline is not confirmed by the shape alone. Must verify with values and Garmin docs. |
| HRV status label (e.g. balanced/unbalanced) | E09/E10 `hrvSummary.status` | **D** | Enum values unknown. Do not hard-code labels. |
| HRV feedback phrase | E09/E10 `feedbackPhrase` | **D** | Enum/text TBD. |
| Deviation from baseline | `lastNightAvg` − midpoint of balanced band | **T** | Formula defined in contract section 7. Midpoint is a derivation, not a Garmin field. |
| HRV 7-day trend | Mean of `lastNightAvg` over 7 days | **H** | Needs ≥ 7 days stored. Sample covers only 8 days in one range response. |
| HRV intraday readings (for night chart) | E09 `hrvReadings[]` | **D** (structure) **T** (time parsing) | 97 readings in sample; reading timestamps are strings (format TBD). Whether the readings cover exactly the sleep window is not confirmed. |

---

## 3. Resting heart rate

| Element | Source | Status | Notes |
|---|---|---|---|
| Today's resting HR | E17 `restingHeartRate`; E23 `restingHeartRate` | **D** | Two sources for the same concept. Check agreement before choosing one. |
| Garmin 7-day average RHR | E17/E23 `lastSevenDaysAvgRestingHeartRate` | **D** | Garmin-provided average. |
| Own 7-day RHR average | Mean of stored `resting_hr` | **H** | Used only if Garmin's average is not wanted. |
| RHR trend (30/60 days) | Aggregation over stored history | **H** | History not in samples. |
| Resting HR used for zones | E06 `restingHeartRateUsed` | **D** | Context only. |
| Fitness-age RHR component | E07 `components.rhr.value`, `stale` | **D** | Stale flag must be displayed or handled; rule undefined. |

---

## 4. Sleep duration and score

| Element | Source | Status | Notes |
|---|---|---|---|
| Sleep duration (total) | E12 `sleepTimeSeconds` | **D T** | Seconds per name; convert to hours for display. Confirm whether it excludes `unmeasurableSleepSeconds`. |
| Nap duration | E12 `napTimeSeconds` | **D T** | Confirm whether included in sleep duration (not stated). |
| Sleep stages (deep, light, REM, awake) | E12 `deepSleepSeconds`, `lightSleepSeconds`, `remSleepSeconds`, `awakeSleepSeconds` | **D T** | Stage sum vs total: unverified. |
| Sleep score (overall) | E12 `sleepScores.overall.value` | **D** | Scale and range not in sample. Display as-is with `qualifierKey` until verified. |
| Score qualifier label | E12 `sleepScores.overall.qualifierKey` | **D** | Enum TBD. |
| Stage percentage vs ideal range | E12 `sleepScores.{remPercentage, lightPercentage, deepPercentage}` with `idealStartInSeconds`, `idealEndInSeconds` | **D** | Units of "ideal" fields are named in seconds, but relation to percentage is unclear. Verify before displaying. |
| Bedtime and wake time | E12 `sleepStartTimestampLocal`, `sleepEndTimestampLocal` | **T** | Numeric type, epoch unit TBD. |
| Recommended bedtime | E12 `sleepNeed.recommendedBedtimeStartMins`, `recommendedBedtimeEndMins` | **D T** | Minutes name-stated; reference (minutes since midnight?) TBD. |
| Sleep need (baseline vs actual) | E12 `sleepNeed.baseline`, `actual` | **D** | Unit TBD. |
| Sleep window confirmed flag | E12 `sleepWindowConfirmed` | **D** | |
| 7-day sleep average | Mean of `sleep_time_s` over 7 days | **H** | History needed. |
| Sleep score trend | Aggregation of `score_overall` | **H** | History needed. |
| Required user input | — | **U** | Target sleep duration (if not using Garmin's `baseline`). |

Note: E12 is requested with `date` (query), set by the probe to the run date. The dashboard must send the user's local date, and the night Garmin returns for that date must be confirmed before this row is trusted.

---

## 5. Recent activities

| Element | Source | Status | Notes |
|---|---|---|---|
| Activity list | E03 (search) | **D** | Probe used `start=0`, `limit=5`. Date-range parameters and paging are not yet known. |
| Activity name | E03 `activityName` | **D** | |
| Activity start (local) | E03 `startTimeLocal` | **D T** | Format TBD; parse to local date. |
| Activity type | E03 `activityType.typeKey` | **D** | Enum TBD. Map to display label (**U** if the user wants custom labels). |
| Distance | E03 `distance` | **D T** | Unit TBD. |
| Duration | E03 `duration` | **D T** | Unit TBD. |
| Average HR, max HR | E03 `averageHR`, `maxHR` | **D** | Unit TBD. |
| Calories | E03 `calories` | **D** | Unit TBD. |
| Training load | E03 `activityTrainingLoad` | **D** | Scale TBD. |
| Training effect label | E03 `trainingEffectLabel` | **D** | Enum TBD. |
| Favorite / PR flags | E03 `isFavorite`, `isPR` | **D** | |
| Thumbnail / images | E03 `hasImages`, `hasVideo` | **D** (flags only) | Image URLs are not in E03; E01 `activityImages` is empty in sample. |
| Pace | Derived from `averageSpeed` | **T** | Requires speed unit confirmation. Do not display until verified. |

Missing: activity detail view requires E01 per activity (**D**), and activity splits (**D**).

---

## 6. Weekly training volume

Derived. Definition must be decided by the user.

| Element | Source | Status | Notes |
|---|---|---|---|
| Weekly distance | Sum of `distance` (E03/E01) over ISO week | **H T U** | Requires distance unit verification. **U**: which activity types count (run only, all sports). |
| Weekly duration | Sum of `duration` over ISO week | **H T U** | Requires duration unit. **U**: whether to use `movingDuration` or `duration`. |
| Weekly intensity minutes | Sum of `moderateIntensityMinutes + vigorousIntensityMinutes` | **H** | Choose source: per-activity (E03) or daily (E17). Must not double count. |
| Weekly activity count | Count of activities per ISO week | **H** | Uses E03 `activityId` per date. |
| Week boundary | Week start day | **U** | Garmin's `firstDayOfWeek` (E26) is available as **D**; the user must confirm it applies to the dashboard. |
| Steps per week | Sum of E15 `totalSteps` | **H** | Available for 8 days in sample only. |

Required history: at least the number of weeks shown.

---

## 7. Acute and chronic training load

Not directly available. Garmin provides per-activity load (`activityTrainingLoad`) but no acute or chronic aggregate in any sampled endpoint.

| Element | Source | Status | Notes |
|---|---|---|---|
| Per-activity load | E01/E03 `activityTrainingLoad` | **D** | Scale TBD. |
| Daily load | Sum over activities by date | **T** | Rule for multiple activities per date: sum (proposed). Multi-sport parent/child handling TBD (`isParent`). |
| Acute load (ATL) | EWMA of daily load, short window | **H U** | Window length and smoothing constant are user decisions. Commonly 7 days, but not a Garmin definition. |
| Chronic load (CTL) | EWMA of daily load, long window | **H U** | Window length and smoothing constant are user decisions. Commonly 42 days. Needs at least that much history before values are meaningful. |
| ATL/CTL ratio (balance) | ATL / CTL | **T** | Depends on ATL/CTL decisions. Interpretation thresholds are **U**. |
| Garmin's own load ratio or status | — | **X** | Not in samples. |

Required history: CTL requires at least the chosen long window (proposed 42 days). The 8-day sample is insufficient to compute or validate CTL. Nothing should be displayed as CTL until that history exists.

Decision needed before implementation:
1. Daily load definition (sum of `activityTrainingLoad` per date, or other).
2. ATL window and smoothing.
3. CTL window and smoothing.
4. How to handle days with no activity (load = 0, or excluded).

---

## 8. Historical recovery trends

Recovery trend is a composite. No Garmin field is named "recovery". The composite needs input selection and weights from the user.

| Element | Source | Status | Notes |
|---|---|---|---|
| HRV trend | E09/E10 `lastNightAvg` over time | **H** | History needed. |
| RHR trend | E17/E23 `restingHeartRate` over time | **H** | History needed. |
| Sleep duration trend | E12 `sleepTimeSeconds` over time | **H T** | History needed; unit conversion. |
| Sleep score trend | E12 `sleepScores.overall.value` over time | **H** | Scale TBD. |
| Body Battery at wake trend | E17 `bodyBatteryAtWakeTime` over time | **H** | History needed. |
| Body Battery charged/drained trend | E17 `bodyBatteryChargedValue`, `bodyBatteryDrainedValue` | **H** | History needed. |
| Stress trend | E17 `averageStressLevel` | **H** | Scale TBD. |
| SpO2 trend | E17 `averageSpo2`, E12 `averageSpO2Value` | **H** | Two sources; choose one (**U** if needed). |
| Fitness age trend | E07 `fitnessAge` over time | **H** | Snapshot per date; Garmin-calculated. |
| Composite recovery score | Weighted combination of the above | **U X** | No Garmin composite. The formula and weights must be defined by the user. Not implemented. |
| Recovery vs baseline | HRV deviation (contract section 7) | **T H** | Requires baseline and HRV history. |

Required history: at least 28 days for a meaningful trend view. The 8-day sample supports only structure checks.

---

## 9. Summary matrix

| Metric | D | T | H | U | X |
|---|:-:|:-:|:-:|:-:|:-:|
| Daily training status (Garmin label) | | | | | ✔ |
| Daily training load | ✔ | ✔ | ✔ | | |
| Intensity minutes | ✔ | | ✔ | | |
| HRV (nightly, baseline) | ✔ | | | | |
| HRV deviation | | ✔ | | | |
| HRV 7-day trend | | | ✔ | | |
| Resting HR (today) | ✔ | | | | |
| RHR trend | | | ✔ | | |
| Sleep duration | ✔ | ✔ | | | |
| Sleep score | ✔ | | | | |
| Sleep trend | | | ✔ | | |
| Recent activities | ✔ | ✔ | | | |
| Weekly training volume | | ✔ | ✔ | ✔ | |
| ATL | | | ✔ | ✔ | |
| CTL | | | ✔ | ✔ | |
| Recovery trend (composite) | | | ✔ | ✔ | ✔ |

## 10. Blocking gaps (must be closed before implementation)

1. **Training status endpoint** — Garmin's training status is not in any sampled endpoint. Probe needed.
2. **Activity query parameters** — E03 date range and paging unknown; the probe only used `limit=5`.
3. **Sleep date** — E12 uses the `date` query, but which night it returns is not confirmed.
4. **Units** — distance, duration, speed, HR, HRV, sleep need, weight, percentage fields.
5. **Timestamp formats and epoch unit** — required for "recent activities" and "bedtime".
6. **Score scales** — sleep score, Body Battery, stress, training load.
7. **History depth** — all trend metrics and ATL/CTL.
8. **User decisions** — weekly volume definition, daily load definition, ATL/CTL windows, recovery-composite inputs and weights, activity-type labels.
9. **E13 and E18 errors** — if a summary-by-date endpoint is needed, its request format is unknown.
