# Garmin Data Inventory

## 1. Scope and limitations

**Source:** `shapes.json` (26 endpoint probes against Garmin Connect Personal API).
**Not available in this environment:** `backend/`, `backend/test/out/shapes.json`, and any Garmin integration code. The only copy found is `/mnt/user-data/uploads/shapes.json`.

What `shapes.json` contains:
- **Type shapes only, no values.** Each field is a type label (`number`, `string`, `boolean`, `null`, `array(N)`). Nothing states units, scales, enum meanings, or timestamp formats.
- **Sampled, not guaranteed.** `null` means the sampled value was null. `array(N)` is the sample length, not a fixed size. Fields absent from a sample are unknown, not absent from Garmin.
- **One user, one short window.** Date-range endpoints cover 2026-11-04 to 2026-11-11 (8 days). Single-date endpoints use 2026-11-11. Nothing identifies historical depth.
- **Request parameters are known from the probe script** (`end-points-initial-test.js`, section 2b). `shapes.json` itself stores only the path, so the script is the only source for query parameters.
- **Only the first array element is inspected.** `shape()` records the shape of `array[0]` only. Fields missing from the first element, or fields that appear only in later elements, are not recorded. The `null` and `array(0)` markers therefore describe one element, not the whole array.
- **`size` is a character count.** The script stores `text.length` (characters), not bytes, so the `size` field is not a byte size.

Consequences for this document:
- **Units** are marked `name-stated` only when the field name itself carries the unit (e.g. `...Seconds`, `...Meters`, `...Minutes`, `...Kilocalories`). Everything else is `unknown`.
- **Examples** are shape excerpts, not response values. No actual response values exist in the sources.

## 2. Endpoint status summary

| # | Path (prefix omitted where noted) | HTTP | Sample shape | Granularity |
|---|---|---|---|---|
| E01 | `/activity-service/activity/{id}` | 200 | object | Activity |
| E02 | `/activity-service/activity/{id}/workouts` | 200 | `array(0)` (empty) | Activity |
| E03 | `/activitylist-service/activities/search/activities` | 200 | `array(5)` | Activity (list) |
| E04 | `/download-service/files/activity/{id}` | **406** | binary (not stored) | Activity file |
| E05 | `/wellnessactivity-service/activity/summary/range/{start}/{end}` | 200 | `array(0)` (empty) | Activity (daily range) |
| E06 | `/biometric-service/heartRateZones/v2` | 200 | `array(1)` | Profile setting |
| E07 | `/fitnessage-service/fitnessage/v2/{date}` | 200 | object | Daily snapshot |
| E08 | `/goal-service/goal/user/effective/weightgoal/{start}/{end}` | 200 | object | Goal |
| E09 | `/hrv-service/hrv/{date}` | 200 | object | Daily detail (intraday readings) |
| E10 | `/hrv-service/hrv/daily/{start}/{end}` | 200 | object with `array(8)` | Daily range |
| E11 | `/nutrition-service/food/logs/{date}` | 200 | object | Daily |
| E12 | `/sleep-service/sleep/dailySleep` | 200 | object | Daily (query `date`) |
| E13 | `/sleep-service/sleep/dailySleepSummariesByDate` | **400** | `{}` | — |
| E14 | `/usersummary-service/stats/hydration/daily/{start}/{end}` | 200 | `array(0)` (empty) | Daily range |
| E15 | `/usersummary-service/stats/steps/daily/{start}/{end}` | 200 | `array(8)` | Daily range |
| E16 | `/usersummary-service/stats/stress/daily/{start}/{end}` | 200 | `array(8)` | Daily range |
| E17 | `/usersummary-service/usersummary/daily` | 200 | object | Daily |
| E18 | `/usersummary-service/v2/dailysummaries` | **400** | `{}` | — |
| E19 | `/weight-service/weight/all/{start}/{end}` | 200 | `array(0)` (empty) | Measurement list |
| E20 | `/weight-service/weight/range/{start}/{end}` | 200 | object (no daily items) | Range summary |
| E21 | `/wellness-service/wellness/bodyBattery/reports/daily` | 200 | `array(8)` | Daily (with intraday arrays) |
| E22 | `/wellness-service/wellness/daily/spo2acclimation/{date}` | 200 | object | Daily (intraday arrays) |
| E23 | `/wellness-service/wellness/dailyHeartRate` | 200 | object | Daily (intraday array) |
| E24 | `/periodichealth-service/menstrualcycle/summary/{date}` | 200 | object | Daily — **sensitive** |
| E25 | `/periodichealth-service/menstrualcycle/dayview/{date}` | 200 | object | Daily — **sensitive** |
| E26 | `/userprofile-service/userprofile/settings` | 200 | object | Profile |

Counts: 23 returned 200 (4 of those empty: E02, E05, E14, E19). 3 returned errors (E04 406, E13 400, E18 400). Errors E13 and E18 return `{}` with no message, so their cause is unknown.

### 2b. Request parameters (from `end-points-initial-test.js`)

`today` is the script's run date. `D.date` is computed with `toISOString()` (UTC), while `from` is computed with `setDate()` (local time). See section 4.5 for the consequence.

| Endpoint | Path variables | Query parameters sent |
|---|---|---|
| E01 | `activityId` = first item of E03 | none |
| E02 | `activityId` | none |
| E03 | none | `start=0`, `limit=5` (returns at most 5; the full list was not probed) |
| E04 | `activityId` | none (406) |
| E05 | `fromDate` = today−7, `untilDate` = today | none |
| E06 | none | none |
| E07 | `calendarDate` = today | none |
| E08 | `startDate` = today−7, `endDate` = today | none |
| E09 | `calendarDate` = today | none |
| E10 | `fromDate` = today−7, `toDate` = today | none |
| E11 | `date` = today | none |
| E12 | none | `date` = today |
| E13 | none | `date` = today (400) |
| E14, E15, E16 | `startDate` = today−7, `endDate` = today | none |
| E17 | none | `calendarDate` = today |
| E18 | none | `calendarDate` = today (400) |
| E19, E20 | `startDate` = today−7, `endDate` = today | none |
| E21 | none | `startDate` = today−7, `endDate` = today |
| E22 | `calendarDate` = today | none |
| E23 | none | `date` = today |
| E24, E25 | `calendarDate` = today | none |
| E26 | none | none |

Consequences:
- The 8-day window in the samples (2026-11-04 to 2026-11-11) is the script's today−7 to today range.
- E03 returns at most 5 items per request because `limit=5`. The 5 items are not the user's full history, and the paging rule for more items is unknown.
- The E13 and E18 400s used `date` and `calendarDate` respectively. The script saved `r.text.slice(0,160)`, which was `{}`, so the parameter names may still be wrong. Nothing in the response confirms it.
- The `shapes.json` run is one request per endpoint, with no date-range variation.

## 3. Endpoint details

Type labels follow `shapes.json`. Units: `name-stated` = unit is in the field name; otherwise `unknown`. Nullable = observed `null` in sample only.

### E01 — Activity detail
**Purpose:** Full record for one activity (summary, metadata, splits).
**Granularity:** Activity. **Historical coverage:** unknown (one activity sampled).

| Field path | Type | Unit | Notes |
|---|---|---|---|
| `activityId` | number | — | Primary key of activity |
| `activityUUID.uuid` | string | — | Nested object here; flat string in E03 |
| `activityName` | string | — | |
| `userProfileId` | number | — | |
| `isMultiSportParent` | boolean | — | |
| `activityTypeDTO.{typeId, typeKey, parentTypeId}` | number, string, number | — | Activity type |
| `eventTypeDTO.{typeId, typeKey}` | number, string | — | |
| `accessControlRuleDTO.{typeId, typeKey}` | number, string | — | Privacy |
| `timeZoneUnitDTO.timeZone` | string | — | IANA-style zone name not verified |
| `metadataDTO.*` | mixed | — | See below |
| `summaryDTO.*` | number unless noted | see below | Core metrics |
| `splitSummaries[]` | array(4) of objects | see below | Per-split metrics |

`metadataDTO`: `isOriginal` bool; `fileFormat.{formatId, formatKey}`; `lastUpdateDate` string; `uploadedDate` string; `videoUrl` null; `userInfoDto.{userProfilePk number, displayname string, fullname string, profileImageUrlLarge/Medium/Small string, userPro bool}`; `childIds` array(0); `childActivityTypes` array(0); `sensors` null; `activityImages` array(0); `manufacturer` string; `lapCount` number; `hasRunPowerWindData` bool; `calendarEventInfo` null; `hasMultiDayActivities` bool; `elevationCorrected` bool; `manualActivity` bool; `autoCalcCalories` bool; `favorite` bool; `trimmed` bool; `runPowerWindDataEnabled` bool; `personalRecord` bool; `gcj02` bool.

`summaryDTO` (all number unless noted):
- Timestamps: `startTimeLocal` string, `startTimeGMT` string.
- Duration/distance: `distance`, `duration`, `movingDuration`, `elapsedDuration`. Unit: `unknown` (name suggests but does not state).
- Speed: `averageSpeed`, `averageMovingSpeed`, `maxSpeed`. Unit: `unknown`.
- Energy: `calories`, `bmrCalories`. Unit: `unknown`.
- Heart rate: `averageHR`, `maxHR`, `minHR`. Unit: `unknown`.
- Cadence: `averageRunCadence`, `maxRunCadence`. Unit: `unknown`.
- Power: `averagePower`, `maxPower`, `minPower`, `normalizedPower`, `totalWork`. Unit: `unknown`.
- Running dynamics: `groundContactTime`, `strideLength`, `verticalOscillation`, `verticalRatio`. Unit: `unknown`.
- Training effect: `trainingEffect`, `anaerobicTrainingEffect` (number); `aerobicTrainingEffectMessage`, `anaerobicTrainingEffectMessage`, `trainingEffectLabel` (string).
- Load: `activityTrainingLoad`, `minActivityLapDuration`. Unit: `unknown`.
- Direct feedback: `directWorkoutFeel`, `directWorkoutRpe`. Scale: `unknown`.
- Intensity: `moderateIntensityMinutes`, `vigorousIntensityMinutes` — `name-stated` (minutes).
- Other: `waterEstimated`, `steps`, `beginPotentialStamina`, `endPotentialStamina`, `minAvailableStamina`, `differenceBodyBattery`.

`splitSummaries[]` (sample length 4; per split): `distance`, `duration`, `movingDuration`, `averageSpeed`, `averageMovingSpeed`, `maxSpeed`, `calories`, `bmrCalories`, `averageHR`, `maxHR`, `averageRunCadence`, `maxRunCadence`, `averagePower`, `maxPower`, `normalizedPower`, `groundContactTime`, `strideLength`, `verticalOscillation`, `verticalRatio`, `totalExerciseReps`, `avgForce`, `maxForce`, `normalizedForce`, `maxDistance`, `maxDistanceWithPrecision`, `avgStepFrequency`, `avgStepLength`, `noOfSplits` (number); `splitType` (string). All units `unknown`.

### E02 — Activity workouts
**Purpose:** Structured workout definition linked to an activity.
**Sample:** `array(0)`, so item schema is **unknown**. Nothing can be documented beyond "empty for this activity".

### E03 — Activity list (search)
**Purpose:** Paged or filtered list of activities; each item is a summary.
**Granularity:** Activity. **Query:** `start=0`, `limit=5`. The 5 items are the probe's page, not the user's full activity list. Date range of the returned items is unknown.

Item fields (per element):
- Identity: `activityId` number; `activityUUID` string (flat — differs from E01); `activityName` string.
- Timestamps: `startTimeLocal`, `startTimeGMT`, `endTimeGMT` string; `beginTimestamp` number (epoch unit unknown).
- Type: `activityType.{typeId, typeKey, parentTypeId}`; `eventType.{typeId, typeKey}`; `sportTypeId` number; `privacy.{typeId, typeKey}`.
- Flags (bool): `isFavorite`, `isPR`, `isAutoCalcCalories`, `isParent`, `hasImages`, `hasVideo`, `isElevationCorrected`, `isDecoDive`, `isManualActivity`, `qualifyingDive`, `autoCalcCalories`, `elevationCorrected`, `pr`, `decoDive`, `favorite`, `parent`, `manualActivity`.
- Owner: `ownerId` number; `ownerDisplayName`, `ownerFullName`, `ownerProfileImageUrlSmall/Medium/Large` string.
- Core metrics (unit `unknown`): `distance`, `duration`, `elapsedDuration`, `movingDuration`, `averageSpeed`, `maxSpeed`, `calories`, `bmrCalories`, `averageHR`, `maxHR`, `steps`, `avgPower`, `maxPower`, `normPower`, `waterEstimated`, `activityTrainingLoad`, `minActivityLapDuration`.
- Cadence (name says steps/min): `averageRunningCadenceInStepsPerMinute`, `maxRunningCadenceInStepsPerMinute`, `maxDoubleCadence`.
- Training effect: `aerobicTrainingEffect`, `anaerobicTrainingEffect` (number); `trainingEffectLabel`, `aerobicTrainingEffectMessage`, `anaerobicTrainingEffectMessage` (string).
- Running dynamics: `avgVerticalOscillation`, `avgGroundContactTime`, `avgStrideLength`, `avgVerticalRatio`.
- Intensity: `moderateIntensityMinutes`, `vigorousIntensityMinutes` (`name-stated` minutes).
- Body battery: `differenceBodyBattery`.
- HR zones: `hrTimeInZone_1` … `hrTimeInZone_5` (number; unit probably seconds, **unverified**).
- Power zones: `powerTimeInZone_1` … `powerTimeInZone_5`.
- Dive fields: `summarizedDiveInfo.summarizedDiveGases` array(0) — empty, schema unknown.
- Device: `manufacturer` string; `lapCount` number.
- `splitSummaries[]` (array(4) sample): `noOfSplits`, `duration`, `maxDistance`, `maxDistanceWithPrecision`, `distance`, `averageSpeed`, `maxSpeed`, `avgStepFrequency`, `avgStepLength`, `verticalRatio`, `verticalOscillation`, `avgGroundContactTime` (number); `splitType` (string).
- `isMultiSportParent`-equivalent: `isParent` / `parent` (duplicate).

### E04 — Activity file download
**Purpose:** Original activity file (FIT etc.).
**Status:** HTTP 406 (`NotAcceptableException`). Response is a binary archive, which the sampler did not store. The response shape is unknown. Garmin's accepted format or Accept header is unknown. Do not treat as usable until a successful response is captured.

### E05 — Wellness activity summary (range)
**Sample:** `array(0)`. Item schema **unknown**. Relationship to E01/E03 unknown.

### E06 — Heart rate zones (v2)
**Purpose:** Zone thresholds for a sport.
**Granularity:** Profile setting. Sample `array(1)`.

Fields: `trainingMethod` string; `sport` string; `restingHeartRateUsed`, `lactateThresholdHeartRateUsed`, `maxHeartRateUsed` number (bpm likely, **unverified**); `zone1Floor` … `zone5Floor` number (same unit caveat); `restingHrAutoUpdateUsed` bool.

### E07 — Fitness age (v2)
**Purpose:** Estimated fitness age plus contributing components for one date.
**Granularity:** Daily snapshot.

- `chronologicalAge`, `fitnessAge`, `achievableFitnessAge`, `previousFitnessAge` — number (years, name-implied, **unverified**).
- `components.vigorousDaysAvg` {`value` number, `stale` bool, `numOfWeeksForIm` number}
- `components.rhr` {`value` number, `stale` bool}
- `components.vigorousMinutesAvg` {`value` number, `stale` bool, `numOfWeeksForIm` number}
- `components.bmi` {`value`, `targetValue`, `improvementValue`, `potentialAge`, `priority` number; `stale` bool; `lastMeasurementDate` string}
- `lastUpdated` string.

Note: `stale` flags mean some components may not reflect the requested date. Their handling is undocumented.

### E08 — Weight goal (effective)
**Purpose:** Active weight goal for a date range.
**Sensitivity:** health-related.

`userGoals[]` (array(1)): `userGoalCategory` string, `userGoalType` string, `startDate` string, `endDate` null, `goalName` null, `goalValue` number (unit **unknown**; weight unit not stated), `updateDate` string, `createDate` string, `trackingPeriodType` string. `userGoalRanges` null.

### E09 — HRV detail (single date)
**Purpose:** Nightly HRV summary and intraday readings.
**Granularity:** Summary daily plus intraday readings.

- `userProfilePk` number.
- `hrvSummary.calendarDate` string; `weeklyAvg`, `lastNightAvg`, `lastNight5MinHigh` number (unit **unknown**; HRV unit not stated).
- `hrvSummary.baseline` {`lowUpper`, `balancedLow`, `balancedUpper`, `markerValue`} number.
- `hrvSummary.status` string; `feedbackPhrase` string; `createTimeStamp` string.
- `hrvReadings[]` (array(97)): `hrvValue` number; `readingTimeGMT` string; `readingTimeLocal` string.
- Window: `startTimestampGMT`, `endTimestampGMT`, `startTimestampLocal`, `endTimestampLocal`, `sleepStartTimestampGMT`, `sleepEndTimestampGMT`, `sleepStartTimestampLocal`, `sleepEndTimestampLocal` — all string.

### E10 — HRV daily (range)
**Purpose:** Daily HRV summaries.
**Sample:** `hrvSummaries[]` array(8) with the same `hrvSummary` fields as E09 (no readings); `userProfilePk` number.

### E11 — Nutrition log (single date)
**Purpose:** Daily nutrition goals and logged meals.

- `mealDate`, `dayStartTime`, `dayEndTime` string.
- `dailyNutritionGoals` {`calories`, `adjustedCalories`, `carbs`, `adjustedCarbs`, `fat`, `adjustedFat`, `protein`, `adjustedProtein`} number. Unit: `unknown` (kcal implied for `calories`, grams not stated).
- `mealDetails[]` (array(5)): `meal` (**empty object** in sample — schema unknown), `mealNutritionGoals` (same 8 fields as above), `loggedFoods` array(0) — item schema **unknown**.
- `loggedFoodsWithServingSizes` array(0) — schema unknown.

Note: `adjusted*` fields are presumably adjusted goals (name implies, **not verified**).

### E12 — Daily sleep
**Purpose:** Sleep session, stage durations, scores, and sleep-need data for one day.
**Granularity:** Daily (one object). **Query:** `date` = run date. The returned day is therefore the run date, subject to the UTC issue in section 4.5.

Identity: `id` number; `userProfilePK` number (uppercase PK, differs from E09 `userProfilePk`); `calendarDate` string; `ageGroup` string; `sleepVersion` number.

Durations (`name-stated` seconds): `sleepTimeSeconds`, `napTimeSeconds`, `unmeasurableSleepSeconds`, `deepSleepSeconds`, `lightSleepSeconds`, `remSleepSeconds`, `awakeSleepSeconds`.

Timestamps (type **number**, unit and epoch resolution **unknown**): `sleepStartTimestampGMT`, `sleepEndTimestampGMT`, `sleepStartTimestampLocal`, `sleepEndTimestampLocal`. Auto-detected variants `autoSleepStartTimestampGMT`, `autoSleepEndTimestampGMT` are null.

Confirmation: `sleepWindowConfirmed` bool; `sleepWindowConfirmationType` string.
Device flags (bool): `deviceRemCapable`, `retro`, `sleepFromDevice`.
Classifiers (null in sample): `sleepQualityTypePK`, `sleepResultTypePK`.

Physiology:
- SpO2: `averageSpO2Value`, `lowestSpO2Value`, `highestSpO2Value`, `averageSpO2HRSleep` (number).
- Respiration: `averageRespirationValue`, `lowestRespirationValue`, `highestRespirationValue` (number; unit unknown).
- `awakeCount` number; `avgSleepStress` number; `avgHeartRate` number (bpm likely, **unverified**).

Feedback (string): `sleepScoreFeedback`, `sleepScoreInsight`, `sleepScorePersonalizedInsight`.

`sleepScores` (object):
- `overall` {`value` number, `qualifierKey` string}
- `totalDuration`, `stress`, `awakeCount`, `restlessness` {`qualifierKey` string, `optimalStart` number, `optimalEnd` number}
- `remPercentage`, `lightPercentage`, `deepPercentage` {`value` number, `qualifierKey` string, `optimalStart`, `optimalEnd`, `idealStartInSeconds`, `idealEndInSeconds` number}

Score scale (min/max of `overall.value`): **not stated**.

`sleepNeed` and `nextSleepNeed` (identical shape): `userProfilePk` number; `calendarDate` string; `deviceId` number; `timestampGmt` string; `baseline`, `actual` number (unit **unknown**, likely minutes or seconds); `feedback`, `trainingFeedback`, `sleepHistoryAdjustment`, `hrvAdjustment`, `napAdjustment` string; `displayedForTheDay` bool; `recommendedBedtimeStartMins`, `recommendedBedtimeEndMins` number; `preferredActivityTracker` bool.

`sleepAlignment`: `userId` number; `calendarDate` string; `deviceId` number; `isPreferredActivityTracker` bool; `sleepNeedBaselineMins`, `optimalSleepWindowStartMins`, `optimalSleepWindowEndMins`, `optimalSleepWindowMidpointMins`, `lastSleepMidpointMins` number; `status` string.

### E13 — Daily sleep summaries by date
**Status:** HTTP 400, body `{}`. Cause unknown. Not usable as-is.

### E14 — Hydration (daily range)
**Sample:** `array(0)`. Item schema **unknown**. Hydration units are not documented anywhere in the samples except `hydrationMeasurementUnit` in E26.

### E15 — Steps (daily range)
**Sample:** `array(8)`, each item: `calendarDate` string; `totalSteps` number; `totalDistance` number (unit **unknown**); `stepGoal` number.

### E16 — Stress (daily range)
**Sample:** `array(8)`, each item: `calendarDate` string; `values` {`highStressDuration`, `lowStressDuration`, `mediumStressDuration`, `restStressDuration` (`name-stated` duration; unit likely seconds, **unverified**); `overallStressLevel` number (scale **unknown**)}.

### E17 — Daily user summary (single date)
**Purpose:** Full day summary. This is the broadest daily endpoint.

Energy (name-stated kilocalories): `totalKilocalories`, `activeKilocalories`, `bmrKilocalories`; `consumedKilocalories` null; `remainingKilocalories` null; `netCalorieGoal` null.

Steps and distance: `totalSteps`, `dailyStepGoal` number; `totalDistanceMeters`, `wellnessDistanceMeters` number (`name-stated` meters).

Intensity and floors: `moderateIntensityMinutes`, `vigorousIntensityMinutes`, `intensityMinutesGoal` number (minutes); `floorsAscended`, `floorsDescended`, `userFloorsAscendedGoal` number (count); `floorsAscendedInMeters`, `floorsDescendedInMeters` number (meters).

Activity time (name-stated seconds): `highlyActiveSeconds`, `activeSeconds`, `sedentarySeconds`, `sleepingSeconds`, `durationInMilliseconds` (**ms**, name-stated). Note the mixed units across these fields.

Wellness window (strings): `wellnessStartTimeGmt`, `wellnessStartTimeLocal`, `wellnessEndTimeGmt`, `wellnessEndTimeLocal`, `lastSyncTimestampGMT`, `latestSpo2ReadingTimeGmt`, `latestSpo2ReadingTimeLocal`, `latestRespirationTimeGMT`.

Heart rate: `minHeartRate`, `maxHeartRate`, `restingHeartRate`, `lastSevenDaysAvgRestingHeartRate`, `minAvgHeartRate`, `maxAvgHeartRate` number (bpm likely, **unverified**).

Stress: `averageStressLevel`, `maxStressLevel`, `stressQualifier` (string), `stressDuration`, `restStressDuration`, `activityStressDuration`, `uncategorizedStressDuration`, `totalStressDuration`, `lowStressDuration`, `mediumStressDuration`, `highStressDuration` (duration; unit unknown); `stressPercentage`, `restStressPercentage`, `activityStressPercentage`, `uncategorizedStressPercentage`, `lowStressPercentage`, `mediumStressPercentage`, `highStressPercentage` (percent scale **assumed 0–100, unverified**).

Body Battery: `bodyBatteryChargedValue`, `bodyBatteryDrainedValue`, `bodyBatteryHighestValue`, `bodyBatteryLowestValue`, `bodyBatteryMostRecentValue`, `bodyBatteryDuringSleep`, `bodyBatteryAtWakeTime`, `bodyBatteryVersion` (number). Events: `bodyBatteryDynamicFeedbackEvent` and `endOfDayBodyBatteryDynamicFeedbackEvent` {`eventTimestampGmt` string, `bodyBatteryLevel` **string**, `feedbackShortType`, `feedbackLongType` string}. `bodyBatteryActivityEventList[]` array(3): `eventType`, `eventStartTimeGmt`, `feedbackType`, `shortFeedback`, `eventUpdateTimeGmt` string; `timezoneOffset`, `durationInMilliseconds`, `bodyBatteryImpact`, `deviceId` number; `activityName`, `activityType`, `activityId` null.

SpO2: `averageSpo2`, `lowestSpo2`, `latestSpo2` number (**casing differs** from E22 `averageSpO2`).

Respiration: `avgWakingRespirationValue`, `highestRespirationValue`, `lowestRespirationValue`, `latestRespirationValue`, `respirationAlgorithmVersion` number; `latestRespirationTimeGMT` string.

Other: `userProfileId`, `userDailySummaryId` number; `calendarDate`, `uuid`, `source`, `wellnessDescription`(null) — string/null as typed; `includesWellnessData`, `includesActivityData`, `includesCalorieConsumedData` bool; `measurableAwakeDuration`, `measurableAsleepDuration` number; `averageMonitoringEnvironmentAltitude` number (unit **unknown**); `abnormalHeartRateAlertsCount` null.

### E18 — Daily summaries v2
**Status:** HTTP 400, body `{}`. Cause unknown. Not usable as-is.

### E19 — Weight (all)
**Sample:** `array(0)`. Item schema **unknown** (weight entries not present in sample).

### E20 — Weight (range summary)
**Sample:** `dailyWeightSummaries` array(0). `totalAverage` {`from`, `until` number; the rest null}. `previousDateWeight` {`date` number; `calendarDate` string; `weight` number (**unit unknown**); `timestampGMT` number; `weightDelta` number; `bmi`, `bodyFat`, `bodyWater`, `boneMass`, `muscleMass`, `physiqueRating`, `visceralFat`, `metabolicAge` null}. `nextDateWeight` null.

Sensitivity: health-related.

### E21 — Body Battery daily report (range)
**Sample:** `array(8)`, each item:
- `date` string; `charged`, `drained` number.
- Window: `startTimestampGMT`, `endTimestampGMT`, `startTimestampLocal`, `endTimestampLocal` string.
- `bodyBatteryValuesArray` array(6) of `[number, number]` pairs. Meaning of each index **not in sample**; the most likely reading is [timestamp, level], which is **unverified**.
- `bodyBatteryValueDescriptorDTOList` array(2) of {`bodyBatteryValueDescriptorIndex` number, `bodyBatteryValueDescriptorKey` string}. This is the only place the pair meaning is declared; the key values are not in the sample.
- `bodyBatteryDynamicFeedbackEvent`, `endOfDayBodyBatteryDynamicFeedbackEvent`: as E17 (level as **string**).
- `bodyBatteryActivityEvent` array(3): `eventType`, `eventStartTimeGmt`, `feedbackType`, `shortFeedback` string; `timezoneOffset`, `durationInMilliseconds`, `bodyBatteryImpact` number.

### E22 — SpO2 acclimation (single date)
**Purpose:** Overnight/daily SpO2 with intraday arrays.

- `userProfilePK` number; `calendarDate` string.
- Windows (string): `startTimestampGMT`, `endTimestampGMT`, `startTimestampLocal`, `endTimestampLocal`, `sleepStartTimestampGMT`, `sleepEndTimestampGMT`, `sleepStartTimestampLocal`, `sleepEndTimestampLocal`, `latestSpO2TimestampGMT`, `latestSpO2TimestampLocal`.
- Tomorrow-sleep fields: `tomorrowSleep*` (4 fields) and `avgTomorrowSleepSpO2` — all null in sample.
- SpO2 numbers: `averageSpO2`, `lowestSpO2`, `lastSevenDaysAvgSpO2`, `latestSpO2`, `avgSleepSpO2` (number; unit `%` implied, **unverified**).
- `spO2SingleValuesDescriptorList` array(3) {`spo2ValueDescriptorIndex` number, `spo2ValueDescriptorKey` string}; `spO2SingleValues` null.
- `spO2HourlyAveragesDescriptorList` array(3) {`spo2ValueDescIndex`, `spo2ValueDescKey`} (**different key names** than the single-values list).
- `spO2HourlyAverages` array(18) of `[number, number, number]`. Meaning of each index **not in sample**; descriptor list declares names but not values.
- `monitoringEnvironmentValuesDescriptorList` array(2) {`monEnvValueDescIndex`, `monEnvValueDescKey`}.
- `monitoringEnvironmentValues` array(171) of `[number, number]`. Meaning **unverified**.

### E23 — Daily heart rate (single date)
**Purpose:** Min/max/resting HR and intraday series for one day.

- `userProfilePK` number; `calendarDate` string; `startTimestampGMT`, `endTimestampGMT`, `startTimestampLocal`, `endTimestampLocal` string.
- `maxHeartRate`, `minHeartRate`, `restingHeartRate`, `lastSevenDaysAvgRestingHeartRate` number (bpm likely, **unverified**).
- `heartRateValueDescriptors` array(2) {`index` number, `key` string}.
- `heartRateValues` array(489) of `[number, number]`. Order and meaning **not in sample**; the descriptor list is the only hint.

### E24 — Menstrual cycle summary (single date)
**Sensitivity:** health data. Classify as restricted in the data contract.
Fields: `startDate` string; `cycleType` string; `predictedCycle` bool; `dayInCycle`, `periodLength`, `currentPhase`, `lengthOfCurrentPhase`, `daysUntilNextPhase`, `predictedCycleLength`, `educationContentMod` number. `currentPhase` is an **unlabeled enum**; its codes are unknown.

### E25 — Menstrual cycle day view (single date)
**Sensitivity:** health data.
`daySummary` = same fields as E24. `dayLog` null — schema unknown.

### E26 — User profile settings
**Purpose:** Locale, units, and display preferences. **The only endpoint that states the user's unit system.**

- `displayName` string (PII); `preferredLocale` string; `timeZone` string.
- `measurementSystem` string — value **not in sample**; this field is the best candidate for resolving unit questions.
- `numberFormat` string; `hydrationMeasurementUnit` string; `golfDistanceUnit` string; `golfElevationUnit`, `golfSpeedUnit` null.
- `firstDayOfWeek` {`dayId`, `sortOrder` number; `dayName` string; `isPossibleFirstDay` bool}.
- `timeFormat`, `dateFormat` {`formatId` number, `formatKey` string, `minFraction`, `maxFraction` number, `groupingUsed` bool, `displayFormat` string}.
- `powerFormat`, `heartRateFormat` (same shape; `displayFormat` null).
- `hydrationContainers` array(3) {`name` string, `volume` number, `unit` string}.
- `availableTrainingDays`, `preferredLongTrainingDays` null.

## 4. Data quality analysis

### 4.1 Duplicate information across endpoints

| Concept | Locations |
|---|---|
| Steps | E01 `summaryDTO.steps`; E03 `steps`; E15 `totalSteps`; E17 `totalSteps` |
| Total/active/BMR energy | E01 `calories`, `bmrCalories`; E03 `calories`, `bmrCalories`; E17 `totalKilocalories`, `activeKilocalories`, `bmrKilocalories` |
| Intensity minutes | E01, E03, E17 (`moderate…`, `vigorous…`) |
| Resting HR | E07 `components.rhr.value`; E17 `restingHeartRate`; E23 `restingHeartRate` |
| 7-day avg RHR | E17 `lastSevenDaysAvgRestingHeartRate`; E23 `lastSevenDaysAvgRestingHeartRate` |
| Stress | E12 `avgSleepStress`; E16 values; E17 stress fields |
| Body Battery | E17 `bodyBattery*`; E21 `charged`/`drained`; E01 `differenceBodyBattery`; E03 `differenceBodyBattery` |
| SpO2 | E12 `averageSpO2Value`…; E17 `averageSpo2`…; E22 `averageSpO2`… |
| Respiration | E12 `*RespirationValue`; E17 `*RespirationValue` |
| Heart rate min/max | E17; E23 (same day, possibly different values) |
| Activity identity | E01 `activityId` + `activityUUID.uuid`; E03 `activityId` + `activityUUID` (string) |
| Activity flags | E01 `metadataDTO.favorite`, `personalRecord`; E03 `isFavorite`/`favorite`, `isPR`/`pr`, `isParent`/`parent`, `isManualActivity`/`manualActivity`, `isAutoCalcCalories`/`autoCalcCalories`, `isElevationCorrected`/`elevationCorrected`, `isDecoDive`/`decoDive` |
| Splits | E01 `splitSummaries`; E03 `splitSummaries` (different field subsets) |
| Userprofile id | E01 `userProfileId`, `metadataDTO.userInfoDto.userProfilePk`; E09 `userProfilePk`; E12 `userProfilePK`; E12 `sleepNeed.userProfilePk`; E17 `userProfileId`; E22 `userProfilePK`; E23 `userProfilePK`; E10 `userProfilePk` |

### 4.2 Equivalent meaning, different names

| Concept | Name A | Name B | Other |
|---|---|---|---|
| Average HR, activity | `averageHR` (E01, E03) | — | — |
| Running cadence | `averageRunCadence` (E01) | `averageRunningCadenceInStepsPerMinute` (E03) | — |
| Normalized power | `normalizedPower` (E01 summary, splits) | `normPower` (E03) | — |
| Ground contact time | `groundContactTime` (E01) | `avgGroundContactTime` (E03) | — |
| Vertical oscillation | `verticalOscillation` (E01) | `avgVerticalOscillation` (E03) | — |
| Stride length | `strideLength` (E01) | `avgStrideLength` (E03) | — |
| Vertical ratio | `verticalRatio` (E01) | `avgVerticalRatio` (E03) | — |
| Activity UUID | `activityUUID.uuid` (E01, nested) | `activityUUID` (E03, flat) | — |
| Display name | `displayname` (E01 `userInfoDto`) | `displayName` (E26) | — |
| SpO2 average | `averageSpo2` (E17) | `averageSpO2` (E22) | `averageSpO2Value` (E12) |
| SpO2 lowest | `lowestSpo2` (E17, E22) | `lowestSpO2Value` (E12) | — |
| Wellness timestamps | `wellnessStartTimeGmt` (E17) | `startTimestampGMT` (E21, E22, E23) | `startTimeGMT` (E01, E03) |
| Activity privacy | `accessControlRuleDTO` (E01) | `privacy` (E03) | — |
| Activity type | `activityTypeDTO` (E01) | `activityType` (E03) | — |
| Event type | `eventTypeDTO` (E01) | `eventType` (E03) | — |
| Sleep-to-bedtime windows | `sleepStartTimestampGMT` (E12) | `wellnessStartTimeGmt` (E17) | — |
| Heart-rate descriptors | `heartRateValueDescriptors` (E23) | `bodyBatteryValueDescriptorDTOList` (E21) | `spo2ValueDescriptorIndex` etc. — same pattern, different keys |
| Intraday SpO2 descriptor | `spo2ValueDescIndex` / `spo2ValueDescKey` (E22 hourly) | `spo2ValueDescriptorIndex` / `spo2ValueDescriptorKey` (E22 single) | — |

### 4.3 Inconsistent units and formats

- **Duration units differ inside one response.** E17: `highlyActiveSeconds` (seconds, name-stated) and `durationInMilliseconds` (ms, name-stated) sit side by side.
- **Distance units differ across endpoints.** E17 uses `totalDistanceMeters` (name-stated meters). E15 uses `totalDistance`, E01 uses `distance`: units not stated.
- **Timestamp types differ.** Strings (E01, E03, E09, E17, E21–E23) vs numbers (E12 sleep, E03 `beginTimestamp`, E20 `timestampGMT`). Epoch resolution (seconds or ms) is unknown.
- **Timestamp suffix casing differs.** `GMT` (E01, E09, E12), `Gmt` (E17, E21), `GMT` vs `Local` naming varies.
- **Level type inconsistency.** `bodyBatteryLevel` is a **string** (E17, E21); other Body Battery values are numbers.
- **Percent scale unknown.** `*Percentage` fields (E17, E12 `sleepScores`) — range not stated.
- **Score scale unknown.** `sleepScores.overall.value`, `overallStressLevel`, `directWorkoutFeel`, `directWorkoutRpe`, `stressQualifier`: no range or enum values in sample.
- **Enums without values.** `status` (E09, E12 `sleepAlignment`), `cycleType`, `currentPhase`, `trainingMethod`, `sport`, `userGoalType`, `trackingPeriodType`, `source`, `ageGroup`, `feedbackPhrase`, `qualifierKey`, `eventType`, `feedbackShortType`, `feedbackLongType`, `typeKey`, `formatKey`. None of these have documented value sets.
- **Mixed casing for the same role.** `userProfilePK` (E12, E22, E23), `userProfilePk` (E09, E10, E12 `sleepNeed`), `displayname` vs `displayName`.
- **Ordinal or positional arrays.** `hrvReadings`, `heartRateValues`, `bodyBatteryValuesArray`, `spO2HourlyAverages`, `monitoringEnvironmentValues` are arrays of number tuples. The tuple meaning is undeclared, except that descriptor lists exist for some of them.
- **Weight and HRV units not stated** (E09, E20, E08).

### 4.4 Missing or nullable fields

Observed `null` (may or may not be nullable in general):
- E01: `videoUrl`, `sensors`, `calendarEventInfo`.
- E12: `autoSleepStartTimestampGMT`, `autoSleepEndTimestampGMT`, `sleepQualityTypePK`, `sleepResultTypePK`.
- E17: `consumedKilocalories`, `remainingKilocalories`, `netCalorieGoal`, `wellnessDescription`, `abnormalHeartRateAlertsCount`; `activityName`, `activityType`, `activityId` inside `bodyBatteryActivityEventList`.
- E20: all `totalAverage` body-composition fields; `nextDateWeight`.
- E22: all `tomorrowSleep*`, `avgTomorrowSleepSpO2`, `spO2SingleValues`.
- E24/E25: `dayLog` null.
- E26: `golfElevationUnit`, `golfSpeedUnit`, `availableTrainingDays`, `preferredLongTrainingDays`.

Empty sample arrays (schema unknown): E02, E05, E14, E19, `loggedFoods`, `loggedFoodsWithServingSizes`, `summarizedDiveGases`, `childIds`, `childActivityTypes`, `activityImages`, `meal` (object).

Failed probes: E04 (406), E13 (400), E18 (400). No schema can be derived from them.

### 4.5 Timestamp and timezone issues

- **Local vs GMT pairs exist but the offset is unknown.** E01 and E03 provide `startTimeLocal` and `startTimeGMT`, plus E01 `timeZoneUnitDTO.timeZone`. E12 provides numeric local and GMT timestamps with no timezone name.
- **String formats unknown.** No sample value shows whether `startTimeLocal` is ISO 8601, `YYYY-MM-DD HH:MM:SS`, or something else.
- **Numeric timestamp unit unknown.** Epoch seconds vs milliseconds cannot be determined from shapes. `durationInMilliseconds` shows ms exists for durations, so ms is possible for timestamps too.
- **`calendarDate` vs timestamps.** Local date may differ from GMT date for late evening or early morning activities. Which date a sleep or activity is assigned to is undocumented.
- **Sleep date assignment.** E12 is requested with `date` = run date. Whether Garmin returns the night ending that morning or the night starting that evening is unknown.
- **Timezone can change.** E26 `timeZone` is a single profile value, while activities carry their own `timeZoneUnitDTO`. Historical activities recorded in other zones (travel) are not reconcilable from shapes.
- **The probe script mixes UTC and local dates.** `D.date` uses `toISOString()`, which is the UTC date, but `from` uses `setDate()`, which is local. For a user in America/Monterrey (UTC−6), the UTC date is one day ahead from 18:00 to 24:00 local time. A run in that window requests tomorrow's "today", and the 8-day window can be off by one day at its end. This is the same class of bug the contract warns about: date keys must be computed in the user's local zone.
- **Single-date vs range endpoints use different window conventions** (E09 has explicit start/end timestamps; E10 does not).

### 4.6 Fields that need normalization

- Name casing and aliases (sections 4.2, 4.3).
- Unify all timestamps to UTC with an explicit offset captured at ingestion. Requires verifying the format and epoch unit first.
- Normalize durations to one unit (e.g. seconds). Requires unit confirmation first.
- Normalize distance and speed to one unit system, keyed by E26 `measurementSystem` once its value is observed.
- Convert `bodyBatteryLevel` from string to number.
- Split tuple arrays into named rows once their meanings are confirmed.
- Collapse duplicate flags (`isPR`/`pr`, etc.) into one column.
- Store `activityUUID` in one form.

### 4.7 Data that cannot be reliably interpreted from these samples

| Data | Why |
|---|---|
| Any `*Percentage` value | Scale not stated |
| `overall` sleep score, stress level, direct feedback scores | Range and meaning not stated |
| `status`, `qualifierKey`, `feedbackPhrase`, `stressQualifier` | Enum values not in sample |
| `bodyBatteryValuesArray`, `spO2HourlyAverages`, `monitoringEnvironmentValues`, `heartRateValues`, `hrvReadings` tuple order | Tuple meaning not declared (descriptor values absent) |
| `currentPhase` (menstrual) | Enum codes unknown |
| `sleepNeed.baseline` / `actual` / `recommendedBedtime*Mins` | Unit and reference unknown |
| `sleepScores.*` optimal ranges | Units not stated |
| `hrvSummary.baseline.*` | Unit and whether they are personal baselines or population references not stated |
| `fitnessAge` family | Calculation method undocumented; `stale` flags undocumented |
| `adjusted*` nutrition goals | Adjustment basis undocumented |
| Historical data | Only 8 days sampled |
| `trainingEffect`, `activityTrainingLoad`, `aerobic/anaerobicTrainingEffect` | Scale and meaning undocumented |
| `differenceBodyBattery`, `beginPotentialStamina` family | Undocumented |

## 5. Data classification

Categories: **Raw activity** (RA), **Daily health** (DH), **Sleep & recovery** (SR), **HRV** (HRV), **Training load & performance** (TL), **Nutrition & energy** (NE), **Other** (OT). Fields with a single category are listed by endpoint. Repeated field names across endpoints are listed once per endpoint where they appear.

| Category | Endpoint(s) | Fields |
|---|---|---|
| **Raw activity** | E01, E03 | Identity, timestamps, type/event/privacy, owner, flags, device (`manufacturer`, `lapCount`), splits, HR/power/dynamics metrics, zone times |
| **Training load & performance** | E01, E03 | `activityTrainingLoad`, `*TrainingEffect*`, `trainingEffectLabel`, `directWorkoutFeel`, `directWorkoutRpe`, `*Stamina`, `totalWork`, `normalizedPower`, `*Power`, `*TimeInZone_*`, `moderateIntensityMinutes`, `vigorousIntensityMinutes` |
| **Training load & performance** | E06 | HR zone floors, max HR, LT HR, resting HR used |
| **Training load & performance** | E07 | Fitness age and components (vigorous days/min, RHR, BMI) |
| **Daily health** | E15, E16, E17 | Steps, distance, floors, intensity minutes, HR min/max/resting, stress durations/percentages, SpO2, respiration |
| **Daily health** | E22, E23 | SpO2 daily/hourly, HR intraday and daily summary |
| **Daily health** | E20, E08 | Weight (range and goal) |
| **Daily health** | E24, E25 | Menstrual cycle (**restricted**) |
| **Daily health** | E14 | Hydration (empty) |
| **Sleep & recovery** | E12 | Sleep durations, stages, scores, feedback, sleep need, sleep alignment, SpO2/respiration/HR during sleep |
| **Sleep & recovery** | E21, E17 | Body Battery (charged, drained, levels, events) |
| **HRV** | E09, E10 | HRV nightly summary, baseline, status, feedback, intraday readings |
| **Nutrition & energy** | E01, E03, E17 | Calories, BMR calories, active calories |
| **Nutrition & energy** | E11 | Nutrition goals and meal logs |
| **Other** | E26 | Locale, units, time zone, display formats, hydration containers, PII (`displayName`) |
| **Other** | E01 `metadataDTO` | Upload/file metadata, images, profile URLs, privacy setting |
| **Other** | E01/E03 owner fields | Profile image URLs, owner name (PII) |
| **Other** | E01 `activityImages`, `videoUrl` | Media references |

Notes:
- Sleep-related fields inside E17 (`sleepingSeconds`, `measurableAsleepDuration`, `bodyBatteryDuringSleep`) belong to the sleep category but live in the daily summary endpoint. The contract should keep them with their source endpoint and tag them as sleep.
- Energy in E17 (`totalKilocalories`) mixes basal and active. Keep both, do not sum without a defined rule.
- Health-sensitive categories (menstrual cycle, weight, goal) should be flagged in the contract for access control.

## 6. Relationships between endpoints

Join keys observed:
- **Activity:** `activityId` links E01, E02, E03 (`activityId`), E04 (path), E17 `bodyBatteryActivityEventList.activityId` (null in sample).
- **Calendar date:** `calendarDate` (`YYYY-MM-DD`, observed in samples) links E07 (`{date}` path), E09, E10, E11, E12, E15, E16, E17, E21, E22, E23, E24, E25, E16 and E12 `sleepNeed.calendarDate`.
- **User:** `userProfilePk`/`userProfilePK`/`userProfileId`/`userId` (see section 4.1).
- **Device:** `deviceId` in E12 `sleepNeed` and `sleepAlignment`; `deviceId` in E17 `bodyBatteryActivityEventList`.
- **Sleep:** E12 sleep window overlaps with E09 HRV window (`sleepStart*`/`sleepEnd*`) and E22 SpO2 window. Overlap is inferred from field names, not verified.
- **Heart rate zones:** E06 `maxHeartRateUsed`, `restingHeartRateUsed` relate to E17/E23 max and resting HR. Not confirmed to be the same values.
- **Fitness age:** E07 `components.rhr` relates to resting HR; `components.vigorousMinutesAvg` relates to intensity minutes. Stated only by field name.

## 7. Examples (shape excerpts, not values)

Activity identity, from E01:
```json
{ "activityId": "number", "activityUUID": { "uuid": "string" }, "activityName": "string", ... }
```

Same activity in E03 (note flat UUID):
```json
{ "activityId": "number", "activityUUID": "string", "startTimeLocal": "string", "startTimeGMT": "string", ... }
```

HRV intraday, from E09:
```json
"hrvReadings": [ "array(97)", { "hrvValue": "number", "readingTimeGMT": "string", "readingTimeLocal": "string" } ]
```

Heart-rate tuple series, from E23 (tuple meaning unverified):
```json
"heartRateValues": [ "array(489)", [ "array(2)", "number" ] ]
```

Timestamp type inconsistency, from E12 vs E01:
```json
E12: "sleepStartTimestampGMT": "number"
E01: "startTimeGMT": "string"
```

Body Battery level type inconsistency, from E17:
```json
"bodyBatteryLevel": "string"   // while bodyBatteryChargedValue is "number"
```
