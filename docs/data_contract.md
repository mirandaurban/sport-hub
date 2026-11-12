# Garmin Data Contract (proposed)

Status: **proposal, not implemented.** Based on `garmin_data_inventory.md`. Field names in the normalized layer are provisional until units, timestamp formats, and tuple meanings are confirmed from real sample values. Every field marked `TBD` is blocked on that verification.

## 1. Three layers

| Layer | Purpose | Changes when Garmin changes? |
|---|---|---|
| **Raw** | Verbatim stored response per endpoint call | Never rewritten; new rows per fetch |
| **Normalized** | Garmin-independent entities, typed and unit-explicit | Mapping code changes; schema stable |
| **Derived** | Metrics computed from normalized data, with recorded definitions | Definitions versioned |

Rule: Derived metrics read only from Normalized. Normalized reads only from Raw. Dashboards read only from Normalized or Derived.

## 2. Raw layer

### `raw_response`
| Field | Type | Key | Notes |
|---|---|---|---|
| `raw_id` | UUID | PK | |
| `endpoint_key` | string | | Logical name, e.g. `daily_sleep`, `hrv_daily_range` (map from path) |
| `request_path` | string | | Exact path as sent |
| `request_params` | JSON | | Query parameters and path variables. The probe script shows them (inventory section 2b); production code must record them on every call |
| `user_ref` | string | FK → `user_account` | Garmin user id as received |
| `http_status` | int | | 200, 400, 406, … |
| `response_body` | JSON / bytes | | Binary responses (E04) stored separately or not at all — decision TBD |
| `error_body` | JSON | | E13/E18 returned `{}`; store as-is |
| `fetched_at_utc` | timestamptz | | |
| `content_type` | string | | |
| `byte_size` | int | | |

Rules:
- Never drop error responses. A 400 with `{}` is still a record.
- Keep the request date window with the response. Without it, a response cannot be re-attributed to days.

## 3. Normalized layer

Notation: `PK` primary key, `FK` foreign key, `unit` must be filled from the verification step (section 6). `null` means the value is optional for that entity.

### 3.1 `user_account`
| Field | Type | Key | Source | Notes |
|---|---|---|---|---|
| `user_id` | bigint | PK | E26 / `userProfilePk` variants | Internal id mapped to Garmin's `userProfilePk` |
| `garmin_user_pk` | bigint | UNIQUE | E01 `userInfoDto.userProfilePk` | |
| `display_name` | text | | E26 `displayName` | **PII** |
| `preferred_locale` | text | | E26 | |
| `time_zone` | text | | E26 `timeZone` | Profile zone; activity zones stored separately |
| `measurement_system` | text | | E26 `measurementSystem` | **Value unknown** — drives unit conversion once observed |
| `first_day_of_week` | smallint | | E26 `firstDayOfWeek.dayId` | |

### 3.2 `activity`
| Field | Type | Key | Source (E01/E03) | Notes |
|---|---|---|---|---|
| `activity_id` | bigint | PK | `activityId` | Garmin's id |
| `user_id` | bigint | FK | `userProfileId` | |
| `activity_uuid` | uuid | UNIQUE | E01 `activityUUID.uuid`, E03 `activityUUID` | Normalized from two shapes |
| `name` | text | | `activityName` | |
| `type_key` | text | | `activityTypeDTO.typeKey` / `activityType.typeKey` | Enum set TBD |
| `parent_type_id` | int | | `activityTypeDTO.parentTypeId` | |
| `event_type_key` | text | | `eventTypeDTO.typeKey` / `eventType.typeKey` | |
| `sport_type_id` | int | | E03 `sportTypeId` | Only in list shape; null when not provided |
| `start_time_utc` | timestamptz | | `startTimeGMT` | **TBD**: format and parse rule |
| `start_time_local` | timestamp | | `startTimeLocal` | **TBD**: format |
| `timezone_name` | text | | E01 `timeZoneUnitDTO.timeZone` | Only on detail |
| `end_time_utc` | timestamptz | | E03 `endTimeGMT` | |
| `distance_raw` | double | | `distance` | **unit TBD** |
| `duration_raw` | double | | `duration` | **unit TBD** |
| `moving_duration_raw` | double | | `movingDuration` | **unit TBD** |
| `elapsed_duration_raw` | double | | `elapsedDuration` | **unit TBD** |
| `average_speed_raw` | double | | `averageSpeed` | **unit TBD** |
| `max_speed_raw` | double | | `maxSpeed` | **unit TBD** |
| `calories` | double | | `calories` | Unit TBD (kcal likely; not stated) |
| `bmr_calories` | double | | `bmrCalories` | |
| `average_hr` | double | | `averageHR` | Unit TBD (bpm likely) |
| `max_hr` | double | | `maxHR` | |
| `min_hr` | double | | E01 `minHR` | Detail only |
| `steps` | int | | `steps` | |
| `activity_training_load` | double | | `activityTrainingLoad` | Scale TBD |
| `aerobic_training_effect` | double | | `aerobicTrainingEffect` / `trainingEffect` | See note: two names for similar concept |
| `anaerobic_training_effect` | double | | `anaerobicTrainingEffect` | |
| `training_effect_label` | text | | `trainingEffectLabel` | Enum TBD |
| `moderate_intensity_minutes` | int | | `moderateIntensityMinutes` | Minutes (name-stated) |
| `vigorous_intensity_minutes` | int | | `vigorousIntensityMinutes` | Minutes (name-stated) |
| `lap_count` | int | | `lapCount` | |
| `manufacturer` | text | | `manufacturer` | |
| `is_favorite` | bool | | `isFavorite` / `favorite` | Collapsed alias |
| `is_pr` | bool | | `isPR` / `pr` / `personalRecord` | Collapsed alias |
| `is_manual` | bool | | `isManualActivity` / `manualActivity` | Collapsed alias |
| `is_parent` | bool | | `isParent` / `parent` / `isMultiSportParent` | Collapsed alias |
| `privacy_key` | text | | `privacy.typeKey` / `accessControlRuleDTO.typeKey` | Two sources |
| `raw_ref` | uuid | FK → `raw_response` | | Which fetch produced this row |

Extended metrics (running dynamics, power, zone times, dive flags) go to `activity_metric` below, keyed by `activity_id`, to keep the core row stable across sports.

### 3.3 `activity_metric` (key-value, one row per metric)
| Field | Type | Key |
|---|---|---|
| `activity_id` | bigint | PK (part), FK |
| `metric_key` | text | PK (part), e.g. `normalized_power`, `ground_contact_time`, `hr_time_in_zone_1` |
| `value` | double | |
| `unit` | text | Filled after verification |
| `source_field` | text | Exact Garmin field name, for traceability |

Canonical key mapping (examples):
- `normalized_power` ← `normalizedPower` (E01) / `normPower` (E03)
- `ground_contact_time` ← `groundContactTime` (E01) / `avgGroundContactTime` (E03)
- `vertical_oscillation` ← `verticalOscillation` / `avgVerticalOscillation`
- `stride_length` ← `strideLength` / `avgStrideLength`
- `vertical_ratio` ← `verticalRatio` / `avgVerticalRatio`
- `running_cadence_avg` ← `averageRunCadence` / `averageRunningCadenceInStepsPerMinute`
- `hr_time_in_zone_n` ← `hrTimeInZone_n`
- `power_time_in_zone_n` ← `powerTimeInZone_n`

### 3.4 `activity_split`
| Field | Type | Key |
|---|---|---|
| `activity_id` | bigint | PK (part), FK |
| `split_index` | int | PK (part); order from array position |
| `split_type` | text | Garmin `splitType` |
| `distance`, `duration`, `moving_duration`, `average_speed`, `max_speed`, `average_hr`, `max_hr`, `calories` | double | Units TBD |
| `metrics` | JSON | Other split fields (power, dynamics, force) — keep flexible |

Note: `splitSummaries` appears in both E01 (array(4)) and E03 (array(4)) with different subsets. Store the superset in one table; a split from E03 may lack fields that E01 has.

### 3.5 `daily_summary` (from E17, with E15/E16 cross-check)
Composite PK: (`user_id`, `calendar_date`). Single row per user-day.

| Field | Type | Source | Unit |
|---|---|---|---|
| `calendar_date` | date | `calendarDate` | — |
| `steps_total` | int | E17 `totalSteps` / E15 `totalSteps` | count |
| `steps_goal` | int | E17 `dailyStepGoal` / E15 `stepGoal` | count |
| `distance_m` | double | E17 `totalDistanceMeters` | meters (name-stated) |
| `distance_raw_alt` | double | E15 `totalDistance` | **TBD — not confirmed equal to distance_m** |
| `energy_total_kcal` | double | E17 `totalKilocalories` | kcal (name-stated) |
| `energy_active_kcal` | double | E17 `activeKilocalories` | kcal |
| `energy_bmr_kcal` | double | E17 `bmrKilocalories` | kcal |
| `intensity_moderate_min` | int | E17 `moderateIntensityMinutes` | min |
| `intensity_vigorous_min` | int | E17 `vigorousIntensityMinutes` | min |
| `intensity_goal_min` | int | E17 `intensityMinutesGoal` | min |
| `floors_ascended` | int | E17 `floorsAscended` | count |
| `floors_descended` | int | E17 `floorsDescended` | count |
| `resting_hr` | double | E17 `restingHeartRate` / E23 `restingHeartRate` | TBD (bpm likely) |
| `resting_hr_7d_avg` | double | E17 `lastSevenDaysAvgRestingHeartRate` | TBD |
| `min_hr`, `max_hr` | double | E17 `minHeartRate`, `maxHeartRate` | TBD |
| `stress_avg`, `stress_max` | double | E17 `averageStressLevel`, `maxStressLevel` | scale TBD |
| `stress_high_s`, `stress_medium_s`, `stress_low_s`, `stress_rest_s` | double | E17 `*StressDuration` | TBD (seconds likely) |
| `body_battery_charged`, `body_battery_drained` | int | E17 `bodyBatteryChargedValue`, `bodyBatteryDrainedValue` | scale TBD |
| `body_battery_high`, `body_battery_low` | int | E17 `bodyBatteryHighestValue`, `bodyBatteryLowestValue` | scale TBD |
| `body_battery_at_wake` | int | E17 `bodyBatteryAtWakeTime` | scale TBD |
| `body_battery_during_sleep` | int | E17 `bodyBatteryDuringSleep` | scale TBD |
| `spo2_avg`, `spo2_low` | double | E17 `averageSpo2`, `lowestSpo2` | % (name-implied, **TBD**) |
| `respiration_avg_waking` | double | E17 `avgWakingRespirationValue` | TBD |
| `sedentary_s`, `active_s`, `highly_active_s`, `sleeping_s` | int | E17 `*Seconds` | seconds (name-stated) |
| `source` | text | E17 `source` | enum TBD |

Note: `daily_summary` should carry no sleep-specific fields; those belong to `sleep_session`. E17 contains `sleepingSeconds` — store it here with the source tag and reconcile against `sleep_session.sleep_time_s` in a derived check.

### 3.6 `sleep_session` (from E12)
PK: (`user_id`, `calendar_date`). One row per user-day, per E12 contract. `nap` handling TBD.

| Field | Type | Source | Unit |
|---|---|---|---|
| `garmin_sleep_id` | bigint | `id` | — |
| `calendar_date` | date | `calendarDate` | — |
| `sleep_start_utc` | timestamptz | `sleepStartTimestampGMT` | **TBD (epoch unit)** |
| `sleep_end_utc` | timestamptz | `sleepEndTimestampGMT` | **TBD** |
| `sleep_start_local` | timestamp | `sleepStartTimestampLocal` | **TBD** |
| `sleep_end_local` | timestamp | `sleepEndTimestampLocal` | **TBD** |
| `sleep_time_s` | int | `sleepTimeSeconds` | seconds (name-stated) |
| `nap_time_s` | int | `napTimeSeconds` | seconds |
| `deep_s`, `light_s`, `rem_s`, `awake_s` | int | `deepSleepSeconds` etc. | seconds |
| `unmeasurable_s` | int | `unmeasurableSleepSeconds` | seconds |
| `awake_count` | int | `awakeCount` | count |
| `avg_sleep_stress` | double | `avgSleepStress` | scale TBD |
| `avg_hr` | double | `avgHeartRate` | TBD |
| `avg_spo2`, `low_spo2`, `high_spo2` | double | `averageSpO2Value`, `lowestSpO2Value`, `highestSpO2Value` | % TBD |
| `avg_respiration`, `low_respiration`, `high_respiration` | double | `*RespirationValue` | TBD |
| `score_overall` | double | `sleepScores.overall.value` | scale TBD |
| `score_overall_qualifier` | text | `sleepScores.overall.qualifierKey` | enum TBD |
| `score_*` (total duration, stress, awake count, restlessness, rem %, light %, deep %) | json | `sleepScores.*` | see section 6 |
| `feedback_text` | text | `sleepScoreFeedback` | |
| `insight_text` | text | `sleepScoreInsight` | |
| `personalized_insight_text` | text | `sleepScorePersonalizedInsight` | |
| `sleep_window_confirmed` | bool | `sleepWindowConfirmed` | |
| `sleep_window_confirmation_type` | text | `sleepWindowConfirmationType` | enum TBD |
| `sleep_version` | int | `sleepVersion` | |
| `device_id` | bigint | `sleepNeed.deviceId` | |
| `raw_ref` | uuid | FK → `raw_response` | |

### 3.7 `sleep_need` (from E12 `sleepNeed` and `nextSleepNeed`)
PK: (`user_id`, `calendar_date`, `is_next` bool). Two rows per user-day: today's need and next-day's need.

| Field | Type | Source |
|---|---|---|
| `baseline` | double | `baseline` — unit TBD |
| `actual` | double | `actual` — unit TBD |
| `feedback`, `training_feedback`, `sleep_history_adjustment`, `hrv_adjustment`, `nap_adjustment` | text | respective |
| `displayed_for_day` | bool | `displayedForTheDay` |
| `recommended_bedtime_start_min`, `recommended_bedtime_end_min` | int | `recommendedBedtimeStartMins`, `recommendedBedtimeEndMins` — minutes (name-stated) |
| `preferred_activity_tracker` | bool | `preferredActivityTracker` |
| `timestamp_gmt` | text | `timestampGmt` — **TBD format** |

### 3.8 `sleep_alignment` (from E12 `sleepAlignment`)
PK: (`user_id`, `calendar_date`). Fields: `status` (enum TBD), `sleep_need_baseline_min`, `optimal_window_start_min`, `optimal_window_end_min`, `optimal_window_midpoint_min`, `last_sleep_midpoint_min`, `is_preferred_activity_tracker`, `device_id`. Minute-of-day semantics (`...Mins`) TBD.

### 3.9 `hrv_night` (from E10 / E09 `hrvSummary`)
PK: (`user_id`, `calendar_date`).

| Field | Type | Source | Unit |
|---|---|---|---|
| `last_night_avg` | double | `lastNightAvg` | TBD |
| `last_night_5min_high` | double | `lastNight5MinHigh` | TBD |
| `weekly_avg` | double | `weeklyAvg` | TBD |
| `baseline_low_upper` | double | `baseline.lowUpper` | TBD |
| `baseline_balanced_low` | double | `baseline.balancedLow` | TBD |
| `baseline_balanced_upper` | double | `baseline.balancedUpper` | TBD |
| `baseline_marker` | double | `baseline.markerValue` | TBD |
| `status` | text | `status` | enum TBD |
| `feedback_phrase` | text | `feedbackPhrase` | enum TBD |
| `created_at_gmt` | text | `createTimeStamp` | TBD format |
| `window_start_utc`, `window_end_utc` | timestamptz | `startTimestampGMT`, `endTimestampGMT` | TBD |
| `sleep_start_utc`, `sleep_end_utc` | timestamptz | `sleepStartTimestampGMT`, `sleepEndTimestampGMT` | TBD |

### 3.10 `hrv_reading` (from E09 `hrvReadings[]`)
PK: (`user_id`, `reading_time_utc`). Fields: `hrv_value` (double, unit TBD), `reading_time_local` (timestamp), `reading_time_utc` (timestamptz). Parent: `hrv_night` via (`user_id`, `calendar_date`). Parent link must be derived from the date window — not provided by Garmin as a key.

### 3.11 `heart_rate_sample` (from E23 `heartRateValues`)
PK: (`user_id`, `calendar_date`, `sample_index`). Fields: `sample_index` (int), `timestamp_raw` (double; **meaning of index 0 TBD**), `hr_raw` (double; **meaning of index 1 TBD**). Do not persist as timestamps until the tuple layout is confirmed. Store the raw tuple in `raw_response` regardless.

### 3.12 `body_battery_sample` (from E21 `bodyBatteryValuesArray`)
PK: (`user_id`, `calendar_date`, `sample_index`). Same caveat as `heart_rate_sample`. Level type is string in events (E21/E17); normalize to number on ingest.

### 3.13 `body_battery_event`
PK: (`user_id`, `event_start_utc`, `event_type`). Fields: `event_type` (text, from `eventType`), `event_start_utc` (from `eventStartTimeGmt`), `duration_ms` (from `durationInMilliseconds`, ms name-stated), `impact` (from `bodyBatteryImpact`, scale TBD), `feedback_type`, `short_feedback`, `timezone_offset` (**unit TBD**: minutes or seconds).

### 3.14 `spo2_hourly` (from E22 `spO2HourlyAverages`)
PK: (`user_id`, `calendar_date`, `sample_index`). Tuple of 3 numbers; meanings declared by descriptor list, values TBD. Store raw; do not map until descriptor keys are observed.

### 3.15 `stress_day` — not a separate table
E16 values duplicate `daily_summary` stress fields. Store in `daily_summary`; E16 becomes a cross-check source only.

### 3.16 `heart_rate_zone_profile` (from E06)
PK: (`user_id`, `sport`, `effective_from`). Fields: `sport`, `training_method` (enum TBD), `zone1_floor`…`zone5_floor` (unit TBD), `max_hr_used`, `resting_hr_used`, `lactate_threshold_hr_used`, `resting_hr_auto_update` (bool).

### 3.17 `fitness_age_snapshot` (from E07)
PK: (`user_id`, `calendar_date`). Fields: `chronological_age`, `fitness_age`, `achievable_fitness_age`, `previous_fitness_age` (years, **TBD**), `components` (JSON, keep raw structure: `vigorousDaysAvg`, `rhr`, `vigorousMinutesAvg`, `bmi` each with `value`, `stale`), `last_updated_gmt`. The `stale` flag for each component must be stored; no interpretation is defined yet.

### 3.18 `weight_measurement` (from E19 / E20) — **restricted**
PK: (`user_id`, `measured_at_utc`). Schema **not derivable**: E19 is empty; E20 only shows `previousDateWeight`. Provisional fields: `weight` (unit **TBD** — likely grams or kg, not stated), `timestamp_gmt` (number, epoch unit TBD), `calendar_date`, body composition fields (all null in sample; treat as optional).

### 3.19 `weight_goal` (from E08) — **restricted**
PK: (`user_id`, `start_date`, `goal_type`). Fields: `goal_category`, `goal_type`, `goal_value` (unit **TBD**), `start_date`, `end_date` (nullable), `tracking_period_type`, `created_at_gmt`, `updated_at_gmt`.

### 3.20 `menstrual_cycle_day` (from E24/E25) — **restricted**
PK: (`user_id`, `calendar_date`). Fields: `day_in_cycle`, `period_length`, `current_phase` (enum TBD), `length_of_current_phase`, `days_until_next_phase`, `predicted_cycle_length`, `cycle_type` (enum TBD), `predicted_cycle` (bool), `day_log` (schema TBD, null in sample). Never exposed in shared or aggregate views without explicit access rule.

### 3.21 `nutrition_day` (from E11)
PK: (`user_id`, `meal_date`). Fields: `day_start_time`, `day_end_time` (text, format TBD), goals (`calories`, `carbs`, `fat`, `protein` and `adjusted_*` variants; units TBD). `meal_detail` child table — schema **not derivable** (meal object empty, `loggedFoods` empty). Leave a placeholder table; do not design item columns yet.

### 3.22 `user_profile_setting` — merged into `user_account` (section 3.1).

### 3.23 `activity_file` (from E04) — **not modeled**
Not modeled until a successful response is captured. Store only the fetch outcome (`raw_response` with status 406). No file storage fields defined.

## 4. Entity relationships

```
user_account 1 ── * activity
activity    1 ── * activity_metric
activity    1 ── * activity_split
user_account 1 ── * daily_summary          (key: user_id, calendar_date)
user_account 1 ── 1 sleep_session          (per calendar_date)
sleep_session 1 ── 2 sleep_need            (is_next = false/true)
sleep_session 1 ── 1 sleep_alignment
user_account 1 ── * hrv_night              (per calendar_date)
hrv_night    1 ── * hrv_reading            (by date window; derived link)
user_account 1 ── * heart_rate_sample      (per calendar_date)
user_account 1 ── * body_battery_sample    (per calendar_date)
user_account 1 ── * body_battery_event
user_account 1 ── * spo2_hourly            (per calendar_date)
user_account 1 ── * fitness_age_snapshot
user_account 1 ── * heart_rate_zone_profile (per sport and effective date)
user_account 1 ── * weight_measurement      [restricted]
user_account 1 ── * weight_goal             [restricted]
user_account 1 ── * menstrual_cycle_day     [restricted]
user_account 1 ── * nutrition_day
nutrition_day 1 ── * meal_detail           (schema TBD)
```

Join rules:
- Activity-to-day: derive from `start_time_local` date, not `start_time_utc`. Rule is **proposed**, not verified against Garmin's assignment.
- Sleep-to-day: E12 `calendarDate` is the authoritative day key. Sleep spanning midnight belongs to the `calendarDate` Garmin assigns.
- HRV reading-to-night: link by timestamp window in `hrv_night` (`window_start_utc`..`window_end_utc`). Not a Garmin key.

## 5. Identifiers

| Entity | Natural key | Surrogate key | Notes |
|---|---|---|---|
| `user_account` | `garmin_user_pk` | `user_id` | Garmin ids appear as `userProfilePk`, `userProfilePK`, `userProfileId`, `userId` — normalize all |
| `activity` | `activity_id` (Garmin) | — | Stable |
| `activity` | `activity_uuid` | — | Alternate; store both |
| `sleep_session` | (`user_id`, `calendar_date`) | `garmin_sleep_id` | Keep Garmin id for reconciliation |
| `daily_summary` | (`user_id`, `calendar_date`) | — | |
| `hrv_night` | (`user_id`, `calendar_date`) | — | |
| `fitness_age_snapshot` | (`user_id`, `calendar_date`) | — | |
| Samples (HR, Body Battery, SpO2, HRV readings) | (`user_id`, `calendar_date`, `sample_index`) or (`user_id`, timestamp) | — | Depends on tuple layout — TBD |

## 6. Units and conversions (policy)

1. **Store the raw unit as stated by Garmin** in `unit` where known. Convert in Derived, not in Normalized, so the original is recoverable.
2. **Do not convert until the unit is verified.** Units listed as `name-stated` in the inventory can be used now (e.g. `sleepTimeSeconds`). All others are `TBD`.
3. **Verification steps** (must run before any conversion):
   - Capture sample values for every numeric field in E01, E09, E12, E17, E23, E26.
   - Check `measurementSystem` (E26) to determine unit system for distances, speeds, weights, altitudes.
   - Check timestamp strings for format and offset; check numeric timestamps against a known event to determine epoch unit.
   - Check HR tuple arrays against `heartRateValueDescriptors` and `bodyBatteryValueDescriptorDTOList` keys.
4. **Canonical units once verified (proposed):** seconds for durations, metres for distance, km/h or m/s for speed (TBD), kcal for energy, bpm for heart rate, minutes for intensity minutes, UTC for all stored timestamps.

## 7. Derived metrics (definitions only, not implemented)

Each definition lists its inputs, its status against verification, and what must be decided. No formula is final until the user approves it.

| Metric | Definition (proposed) | Inputs | Blocked on |
|---|---|---|---|
| `sleep_hours` | `sleep_time_s / 3600` | `sleep_session.sleep_time_s` | Nothing for seconds; confirm `sleepTimeSeconds` is actual sleep excluding `unmeasurable_s` |
| `sleep_stage_share` | `deep_s / sleep_time_s` (per stage) | `sleep_session` | Confirm stage sum equals `sleep_time_s` (not assumed) |
| `hrv_deviation` | `last_night_avg − baseline_balanced_mid`, where `baseline_balanced_mid = (balancedLow + balancedUpper) / 2` | `hrv_night.*` | Confirm baseline semantics (personal vs population) |
| `hrv_7d_avg` | Mean of `last_night_avg` over 7 days ending at date | `hrv_night` | None; requires history |
| `rhr_7d_avg` | Mean of `resting_hr` over 7 days | `daily_summary` | None; Garmin also provides `lastSevenDaysAvgRestingHeartRate` — compare, do not replace |
| `weekly_distance` | Sum of `activity.distance_raw` over ISO week | `activity` | Distance unit (`measurementSystem` + verification) |
| `weekly_duration` | Sum of `activity.duration_raw` over ISO week | `activity` | Duration unit |
| `weekly_intensity_minutes` | Sum of `moderate + vigorous` minutes over ISO week | `daily_summary` or `activity` | Choose source (E17 daily vs E01/E03 per activity) — must not double count |
| `daily_training_load` | Sum of `activity_training_load` over activities on the date | `activity` | Load scale TBD; Garmin's own load definition not documented |
| `atl` (acute load) | Exponentially weighted average of `daily_training_load`, short window (commonly 7 days) | Derived daily load series | **User decision**: window length and smoothing constant. Not a Garmin field. |
| `ctl` (chronic load) | Exponentially weighted average of `daily_training_load`, long window (commonly 42 days) | Derived daily load series | **User decision**: window length and smoothing constant. Needs ≥ long window of history. |
| `training_status` | None defined. Garmin's own training status is not in any sampled endpoint. | — | Not currently available; see dashboard doc |
| `recovery_trend` | Defined only after user chooses inputs (HRV, RHR, sleep, Body Battery) and aggregation | Multiple | **User decision**; requires history |
| `sleep_score_band` | Garmin `qualifierKey` as-is | `sleep_session.score_overall_qualifier` | Enum values unknown; do not bin numerically |
| `calories_non_active` | `energy_total_kcal − energy_active_kcal` | `daily_summary` | Only if kcal confirmed; do not treat as BMR without check |
| `fitness_age_delta` | `fitness_age − chronological_age` | `fitness_age_snapshot` | Garmin calculation undocumented; present as Garmin value only |

Rules for derived metrics:
- Each derived row stores `definition_version`, input row ids, and computation time.
- Changing a definition creates a new version; old values are not overwritten.
- Missing inputs produce `null`, not zero.

## 8. Sensitive data classification (contract-level)

| Class | Fields | Handling |
|---|---|---|
| **Restricted health** | `menstrual_cycle_day.*`, `weight_measurement.*`, `weight_goal.*` | Separate access; excluded from aggregate exports by default |
| **PII** | `user_account.display_name`, owner name and image URLs in activity list, profile image URLs in activity detail | Store minimal; do not copy into logs |
| **Location-adjacent** | `activity` coordinates (not in shapes; GPS fields absent) — note only | Re-check when real samples include GPS |
| **Standard health** | HR, HRV, SpO2, stress, sleep, Body Battery, respiration | Normal access |

## 9. Versioning and change handling

- `raw_response.endpoint_key` and `request_params` make replay possible when mappings change.
- Each normalized table carries `source_schema_version`. Initial value `0` until verification completes.
- Garmin field additions: store unknown fields in the `metrics` JSON column of the nearest table, do not drop them.
- Garmin field removals or type changes: log to a `schema_drift` table (not yet defined) with endpoint, field, observed type, date.

## 10. Open items blocking the contract

1. Real sample values (not shapes) for all endpoints.
2. Date-key rule: the probe script computed dates in UTC (`toISOString`) and in local time (`setDate`). Production code must compute `calendar_date` in the user's zone (America/Monterrey) and use it for every request and every row key.
2b. E03 returns at most 5 items per request (`limit=5`). Paging and full history are not documented.
3. Timestamp string formats and numeric epoch unit.
4. Unit confirmation for distance, speed, weight, HRV, HR, energy, stress, and percentage fields.
5. Value of `measurementSystem` (E26).
6. Tuple layouts for `heartRateValues`, `bodyBatteryValuesArray`, `spO2HourlyAverages`, `monitoringEnvironmentValues`, `hrvReadings` (descriptor keys).
7. Enum values for `status`, `qualifierKey`, `sport`, `typeKey`, `cycleType`, `currentPhase`, `trainingMethod`.
8. Reason for 400 on E13 and E18; successful capture of E04 if file storage is wanted.
9. Whether `sleepTimeSeconds` excludes `unmeasurableSleepSeconds` and whether stage sums equal it.
10. Historical depth available per endpoint.
11. User decisions: ATL/CTL windows, recovery-trend inputs, weekly-volume definition.
12. Confirmation of which sensitive categories are in scope for storage at all.
