import {Rect, Txt, makeScene2D, Gradient, Img, Line, GradientStop, Node} from '@motion-canvas/2d';

import {data} from "./data";
import {createRef, linear, usePlayback} from "@motion-canvas/core";
import {Color} from "@motion-canvas/core/lib/types/Color";

const EDIT_MODE = false;
const EDIT_MODE_START_TIME = 0; // seconds
const EDIT_MODE_DURATION = 5; // seconds
const PRESSURE = false;
const LEADER_INDEXES = true;
const SCALE_MIN_C = -40;
const SCALE_MAX_C = 50;
const HEATER_ENABLED = new Color('#FFFF00');
const HEATER_DISABLED = new Color('#404040');
const UNITS_FONT_COLOR = new Color('#AAAAAA');
const COLD_COLOR = new Color('#0080FF');
const HOT_COLOR = new Color('#FF0000');
const COLOR_LERP = Color.createLerp("oklch");
const SCALE_STOPS = 20;
const SCALE_TOP = -328;
const SCALE_BOTTOM = 328;
const SCALE_WIDTH = 12;
const SCALE_MIDPOINT = 229;
const FONT_SIZE = 44;
const FONT_COLOR = new Color("#FFFFFF");
const FONT_FAMILY = "Avenir";
const START_ROW_HEIGHT = -328;
const ROW_HEIGHT = 62;
const STRIP_CHART_LINE_WIDTH = 2;
const STRIP_CHART_LEFT = SCALE_MIDPOINT + SCALE_WIDTH/2;
const STRIP_CHART_RIGHT = 920;
const STRIP_CHART_DURATION = 5 * 60; // 5 minutes
const STRIP_CHART_INDEX_TEXT_COLOR = new Color("#FFFFFF");
const STRIP_CHART_INDEX_TEXT_SIZE = 24;
const STRIP_CHART_LEFT_POSITION = 27;
const STRIP_CHART_INDEX_OFFSET = 1;
const SENSOR_INDEX_NUDGE_RIGHT = [60, 0, 0, 0, 0, 0, 0, 0];
const STRIP_CHART_VERTICAL_LINES: [number, string][] = [
    [60, "1 min"],
    [2 * 60, "2 min"],
    [3 * 60, "3 min"],
    [4 * 60, "4 min"],
];
const STRIP_CHART_VERTICAL_TOP = -328;
const STRIP_CHART_VERTICAL_BOTTOM = 328;
const STRIP_CHART_VERTICAL_COLOR = new Color("#808080");
const STRIP_CHART_VERTICAL_WIDTH = 2;
const TEMPERATURE_DIGITS = 1;
const PRESSURE_DIGITS = 1;
const PRESSURE_ATM_DIGITS = 3;
const BATTERY_DIGITS = 2;
const IMAGE_CENTER_X = -57;
const IMAGE_CENTER_Y = 0;
const COLUMNS = [-882, -552, -373, -217, 23, 93];
const LEADER_OFFSET = 50;
const LEADER_LEDGE_WIDTH = 16;
const SENSOR_ROWS = [5, 7, 9, 0, 2, 8, 1, 10];
const CORMORANT_ROW = 3;
const CORMORANT_INDEX = 3;
const BATTERY_ROW = 6;
const BATTERY_COLUMN = 0;
const BATTERY_VALUE_NUDGE_RIGHT = 24;
const HEATER_ROW = 4;
const HEATER_COLUMN = 0;
const PRESSURE_ROWS = [10, 11];
const PRESSURE_COLUMN = 3;
const HEATER_BATT_NUDGE_RIGHT = 16;
const SENSOR_NUDGE_RIGHT = [HEATER_BATT_NUDGE_RIGHT, 0, 0, 0, 0, 0, 0, 0];
const SENSORS = [
  "↳ Battery", // Cormorant Battery
  "Telemega", // Telemega Battery
  "External", // External Bottom
  "Lid", // External Top
  "Internal", // Internal Top
  "Eagle Batt.", // Eagle Battery
  "Vert Cam", // Camera Top
  "Hzn Cam" // Camera Bottom
];
const STRIP_LABEL_NAME = [
    "5",
    "6",
    "8",
    "1",
    "3",
    "7",
    "2",
    "9",
    "4"
];

const SENSOR_INDEXES = [4, 5, 7, 0, 2, 6, 1, 8];
const SENSOR_LOCATIONS: [number, number][] = [
  [-90 + IMAGE_CENTER_X, 60 + IMAGE_CENTER_Y],
  [30 + IMAGE_CENTER_X, 30 + IMAGE_CENTER_Y],
  [-50 + IMAGE_CENTER_X, 120 + IMAGE_CENTER_Y],
  [-20 + IMAGE_CENTER_X, -100 + IMAGE_CENTER_Y],
  [-40 + IMAGE_CENTER_X, -75 + IMAGE_CENTER_Y],
  [180 + IMAGE_CENTER_X, 10 + IMAGE_CENTER_Y],
  [-110 + IMAGE_CENTER_X, -150 + IMAGE_CENTER_Y],
  [160 + IMAGE_CENTER_X, 150 + IMAGE_CENTER_Y],
];
const CORMORANT_LOCATION: [number, number] = [-10 + IMAGE_CENTER_X, -30 + IMAGE_CENTER_Y];

function c_to_f(celsius: number): number {
  return celsius * 9/5 + 32;
}

function mBar_to_kPa(mBar: number): number {
  return mBar * 0.1;
}

function mBar_to_psi(mBar: number): number {
  return mBar * 0.0145;
}

function mBar_to_atm(mBar: number): number {
  return mBar * 9.869e-4;
}

function mBar_to_inHg(mBar: number): number {
  return mBar * 0.02953;
}

function voltage_to_c_10000(voltage: number): number {
  const a = 1.13e-3;
  const b = 2.34e-4;
  const c = 8.78e-8;
  const r = 100000 * (3.3/voltage - 1);
  return 1.0 / (a + b * Math.log(r) + c * Math.pow(Math.log(r),3)) - 273.15
}

function voltage_to_c_5000(voltage: number): number {
  const a = 1.29e-3;
  const b = 2.36e-4;
  const c = 9.52e-8;
  const r = 100000 * (3.3/voltage - 1);
  return 1.0 / (a + b * Math.log(r) + c * Math.pow(Math.log(r),3)) - 273.15
}

function scale_y_map(temperature: number): number {
  const y_t = (temperature - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C);
  const y = (SCALE_TOP - SCALE_BOTTOM) * y_t + SCALE_BOTTOM;
  return y;
}

function row(pos: number): number {
  return START_ROW_HEIGHT + ROW_HEIGHT * pos;
}

export default makeScene2D(function* (view) {
  const leader_y_pos = [
    row(SENSOR_ROWS[0]) + FONT_SIZE / 2 + 2,
    row(SENSOR_ROWS[1]) + FONT_SIZE / 2 + 2,
    row(SENSOR_ROWS[2]) + FONT_SIZE / 2 + 2,
    row(SENSOR_ROWS[3]) + FONT_SIZE / 2 + 2,
    row(SENSOR_ROWS[4]) + FONT_SIZE / 2 + 2,
    row(SENSOR_ROWS[5]) + FONT_SIZE / 2 + 2,
    row(SENSOR_ROWS[6]) + FONT_SIZE / 2 + 2,
    row(SENSOR_ROWS[7]) + FONT_SIZE / 2 + 2,
    row(CORMORANT_ROW)  + FONT_SIZE / 2 + 2
  ];

  const ms5611_temperature_celsius = createRef<Txt>();
  const ms5611_temperature_fahrenheit = createRef<Txt>();
  const ms5611_pressure_kpa = createRef<Txt>();
  const ms5611_pressure_psi = createRef<Txt>();
  const ms5611_pressure_atm = createRef<Txt>();
  const ms5611_pressure_inHg = createRef<Txt>();
  const temperature_celsius = [createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>()];
  const temperature_fahrenheit = [createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>()];
  const temperature_rects = [createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>(), createRef<Rect>()];
  const temperature_lines = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const battery_voltage = createRef<Txt>();
  const heater_enabled = createRef<Txt>();
  const heater_disabled = createRef<Txt>();
  const strip_chart_lines = [createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>(), createRef<Line>()];
  const strip_chart_labels = [createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>(), createRef<Txt>()];

  const fps = usePlayback().fps;

  const stops: GradientStop[] = [];
  for (let i = 0; i <= SCALE_STOPS; i++) {
    const t = i / SCALE_STOPS;
    stops.push({
      offset: t,
      color: COLOR_LERP(COLD_COLOR, HOT_COLOR, t),
    });
  }
  const line_gradient = new Gradient({
    type: 'linear',
    stops: stops,
    toY: SCALE_TOP,
    fromY: SCALE_BOTTOM,
  });
  const rect_gradient = new Gradient({
    type: 'linear',
    stops: stops,
    toY: -(SCALE_BOTTOM - SCALE_TOP) / 2,
    fromY: (SCALE_BOTTOM - SCALE_TOP) / 2,
  });

  for (let [time, text] of STRIP_CHART_VERTICAL_LINES) {
    let x = linear(time / STRIP_CHART_DURATION, STRIP_CHART_RIGHT, STRIP_CHART_LEFT);
    view.add(<>
      <Line lineWidth={STRIP_CHART_VERTICAL_WIDTH} stroke={STRIP_CHART_VERTICAL_COLOR} points={[[x, STRIP_CHART_VERTICAL_TOP], [x, STRIP_CHART_VERTICAL_BOTTOM]]}></Line>
      <Txt fontFamily={FONT_FAMILY} fill={STRIP_CHART_INDEX_TEXT_COLOR} fontSize={STRIP_CHART_INDEX_TEXT_SIZE} position={[x, STRIP_CHART_VERTICAL_BOTTOM]} offset={[0, -1]} text={`${text}`}></Txt>
    </>);
  }

  {
    const node = (<Node></Node>) as Node;
    for (let i = 0; i < 9; i++) {
      view.add(<>
        <Line ref={strip_chart_lines[i]} stroke={line_gradient} lineWidth={STRIP_CHART_LINE_WIDTH}></Line>
      </>);
    }
    view.add(<Rect width={STRIP_CHART_RIGHT - STRIP_CHART_LEFT} height={"100%"}
                   position={[(STRIP_CHART_RIGHT + STRIP_CHART_LEFT) / 2, 0]} fill={"white"}
                   compositeOperation={'destination-in'}></Rect>);
    view.add(node);
  }

  view.add(<>
    <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[0], row(CORMORANT_ROW)]} offset={[-1, -1]}>Cormorant</Txt>
    <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[BATTERY_COLUMN] + HEATER_BATT_NUDGE_RIGHT, row(BATTERY_ROW)]} offset={[-1, -1]}>↳ Voltage</Txt>
    <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[HEATER_COLUMN] + HEATER_BATT_NUDGE_RIGHT, row(HEATER_ROW)]} offset={[-1, -1]}>↳ Heater</Txt>
    <Txt fontFamily={FONT_FAMILY} ref={ms5611_temperature_celsius} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[1], row(CORMORANT_ROW)]} offset={[1, -1]}></Txt>
    <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[1], row(CORMORANT_ROW)]} offset={[-1, -1]}>°C</Txt>
    <Txt fontFamily={FONT_FAMILY} ref={ms5611_temperature_fahrenheit} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[2], row(CORMORANT_ROW)]} offset={[1, -1]}></Txt>
    <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[2], row(CORMORANT_ROW)]} offset={[-1, -1]}>°F</Txt>
    <Txt fontFamily={FONT_FAMILY} ref={battery_voltage} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[BATTERY_COLUMN + 1] + BATTERY_VALUE_NUDGE_RIGHT, row(BATTERY_ROW)]} offset={[1, -1]}></Txt>
    <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[BATTERY_COLUMN + 1] + BATTERY_VALUE_NUDGE_RIGHT, row(BATTERY_ROW)]} offset={[-1, -1]}>V</Txt>
    <Txt fontFamily={FONT_FAMILY} ref={heater_enabled} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[HEATER_COLUMN + 1], row(HEATER_ROW)]} offset={[1, -1]}>On</Txt>
    <Txt fontFamily={FONT_FAMILY} ref={heater_disabled} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[HEATER_COLUMN + 2], row(HEATER_ROW)]} offset={[1, -1]}>Off</Txt>
    <Rect position={[SCALE_MIDPOINT, (SCALE_BOTTOM + SCALE_TOP)/2]} width={SCALE_WIDTH} height={SCALE_BOTTOM - SCALE_TOP} fill={rect_gradient}></Rect>
    <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={12} position={[SCALE_MIDPOINT-SCALE_WIDTH/2,SCALE_BOTTOM]} offset={[1, -1]} text={`${SCALE_MIN_C.toFixed(0)}°C`}></Txt>
    <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={12} position={[SCALE_MIDPOINT+SCALE_WIDTH/2,SCALE_BOTTOM]} offset={[-1, -1]} text={`${c_to_f(SCALE_MIN_C).toFixed(0)}°F`}></Txt>
    <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={12} position={[SCALE_MIDPOINT-SCALE_WIDTH/2,SCALE_TOP]} offset={[1, 1]} text={`${SCALE_MAX_C.toFixed(0)}°C`}></Txt>
    <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={12} position={[SCALE_MIDPOINT+SCALE_WIDTH/2,SCALE_TOP]} offset={[-1, 1]} text={`${c_to_f(SCALE_MAX_C).toFixed(0)}°F`}></Txt>
    <Img src={"White.png"} width={750} position={[IMAGE_CENTER_X, IMAGE_CENTER_Y]}></Img>
    <Line ref={temperature_lines[8]} lineWidth={2} points={[[COLUMNS[2] + LEADER_OFFSET, leader_y_pos[8]], [COLUMNS[2] + LEADER_OFFSET + LEADER_LEDGE_WIDTH, leader_y_pos[8]],CORMORANT_LOCATION]}></Line>
    <Rect ref={temperature_rects[8]} stroke={'black'} lineWidth={2} size={16} position={CORMORANT_LOCATION}></Rect>
  </>);
  if (PRESSURE) {
    view.add(<>
      <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN], row(PRESSURE_ROWS[0])]} offset={[-1, -1]}>Pressure</Txt>
      <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN], row(PRESSURE_ROWS[1])]} offset={[-1, -1]}></Txt>
      <Txt fontFamily={FONT_FAMILY} ref={ms5611_pressure_kpa} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 1], row(PRESSURE_ROWS[0])]} offset={[1, -1]}></Txt>
      <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 1], row(PRESSURE_ROWS[0])]} offset={[-1, -1]}>kPa</Txt>
      <Txt fontFamily={FONT_FAMILY} ref={ms5611_pressure_psi} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 2], row(PRESSURE_ROWS[0])]} offset={[1, -1]}></Txt>
      <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 2], row(PRESSURE_ROWS[0])]} offset={[-1, -1]}>psi</Txt>
      <Txt fontFamily={FONT_FAMILY} ref={ms5611_pressure_atm} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 1], row(PRESSURE_ROWS[1])]} offset={[1, -1]}></Txt>
      <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 1], row(PRESSURE_ROWS[1])]} offset={[-1, -1]}>atm</Txt>
      <Txt fontFamily={FONT_FAMILY} ref={ms5611_pressure_inHg} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 2], row(PRESSURE_ROWS[1])]} offset={[1, -1]}></Txt>
      <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[PRESSURE_COLUMN + 2], row(PRESSURE_ROWS[1])]} offset={[-1, -1]}>inHg</Txt>
    </>);
  }
  for (let i = 0; i < 8; i++) {
    view.add(<>
      <Txt fontFamily={FONT_FAMILY} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[0] + SENSOR_NUDGE_RIGHT[i], row(SENSOR_ROWS[i])]} offset={[-1, -1]} text={SENSORS[i]}></Txt>
      <Txt fontFamily={FONT_FAMILY} ref={temperature_celsius[i]} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[1], row(SENSOR_ROWS[i])]} offset={[1, -1]}></Txt>
      <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[1], row(SENSOR_ROWS[i])]} offset={[-1, -1]}>°C</Txt>
      <Txt fontFamily={FONT_FAMILY} ref={temperature_fahrenheit[i]} fill={FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[2], row(SENSOR_ROWS[i])]} offset={[1, -1]}></Txt>
      <Txt fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} position={[COLUMNS[2], row(SENSOR_ROWS[i])]} offset={[-1, -1]}>°F</Txt>
      <Line ref={temperature_lines[i]} lineWidth={2} points={[[COLUMNS[2] + LEADER_OFFSET, leader_y_pos[i]], [COLUMNS[2] + LEADER_OFFSET + LEADER_LEDGE_WIDTH, leader_y_pos[i]],SENSOR_LOCATIONS[i]]}></Line>
      <Rect ref={temperature_rects[i]} stroke={'black'} lineWidth={2} size={16} position={SENSOR_LOCATIONS[i]}></Rect>
    </>);
  }
  if (LEADER_INDEXES) {
    view.add(<Txt fontFamily={FONT_FAMILY} fill={STRIP_CHART_INDEX_TEXT_COLOR} fontSize={STRIP_CHART_INDEX_TEXT_SIZE} position={[COLUMNS[0], row(CORMORANT_ROW) + STRIP_CHART_LEFT_POSITION]} offset={[1.5, 0]} text={`${CORMORANT_INDEX + STRIP_CHART_INDEX_OFFSET}`}></Txt>);
    for (let i = 0; i < 8; i++) {
      view.add(<Txt fontFamily={FONT_FAMILY} fill={STRIP_CHART_INDEX_TEXT_COLOR} fontSize={STRIP_CHART_INDEX_TEXT_SIZE} position={[COLUMNS[0] + SENSOR_NUDGE_RIGHT[i] + SENSOR_INDEX_NUDGE_RIGHT[i], row(SENSOR_ROWS[i]) + STRIP_CHART_LEFT_POSITION]} offset={[1.5, 0]} text={`${SENSOR_INDEXES[i] + STRIP_CHART_INDEX_OFFSET}`}></Txt>);
    }
    for (let i = 0; i < 9; i++) {
      view.add(<Txt ref={strip_chart_labels[i]} fontFamily={FONT_FAMILY} fill={STRIP_CHART_INDEX_TEXT_COLOR} fontSize={STRIP_CHART_INDEX_TEXT_SIZE} offset={[1, 0]} text={`${STRIP_LABEL_NAME[i]}`}></Txt>);
    }
  }

  const chart_values: number[][] = [[], [], [], [], [], [], [], [], []];
  let last_time = 0;
  const final_index = EDIT_MODE ? (EDIT_MODE_START_TIME + EDIT_MODE_DURATION)*15 : data.length;
  for (let i = last_time*15; i < final_index; i += 15) {
    const time = (i == 0) ? (0) : (Math.min(data[i] as number, 15000));

    const last_ms5611_temp = data[Math.max(i, 1) + 1 - 15] as number;
    const last_ms5611_pres = data[Math.max(i, 1) + 2 - 15] as number;
    const last_analog0 = data[Math.max(i, 1) + 5 - 15] as number;
    const last_analog1 = data[Math.max(i, 1) + 6 - 15] as number;
    const last_analog2 = data[Math.max(i, 1) + 7 - 15] as number;
    const last_analog3 = data[Math.max(i, 1) + 8 - 15] as number;
    const last_analog4 = data[Math.max(i, 1) + 9 - 15] as number;
    const last_analog5 = data[Math.max(i, 1) + 10 - 15] as number;
    const last_analog6 = data[Math.max(i, 1) + 11 - 15] as number;
    const last_analog7 = data[Math.max(i, 1) + 12 - 15] as number;
    const last_battery = data[Math.max(i, 1) + 13 - 15] as number;
    // const last_heater = data[Math.max(i, 1) + 14 - 15] as number;
    const now_ms5611_temp = data[i + 1] as number;
    const now_ms5611_pres = data[i + 2] as number;
    const now_analog0 = data[i + 5] as number;
    const now_analog1 = data[i + 6] as number;
    const now_analog2 = data[i + 7] as number;
    const now_analog3 = data[i + 8] as number;
    const now_analog4 = data[i + 9] as number;
    const now_analog5 = data[i + 10] as number;
    const now_analog6 = data[i + 11] as number;
    const now_analog7 = data[i + 12] as number;
    const now_battery = data[i + 13] as number;
    const now_heater = data[i + 14] as boolean;

    for (let current_frame = last_time * fps; current_frame < time * fps; current_frame++) {
      let current_time = current_frame / fps;
      const t = (current_time - last_time) / (time - last_time);
      const interp_ms5611_temp = linear(t, last_ms5611_temp, now_ms5611_temp);
      const interp_ms5611_pres = linear(t, last_ms5611_pres, now_ms5611_pres);
      const interp_analog0 = linear(t, last_analog0, now_analog0);
      const interp_analog1 = linear(t, last_analog1, now_analog1);
      const interp_analog2 = linear(t, last_analog2, now_analog2);
      const interp_analog3 = linear(t, last_analog3, now_analog3);
      const interp_analog4 = linear(t, last_analog4, now_analog4);
      const interp_analog5 = linear(t, last_analog5, now_analog5);
      const interp_analog6 = linear(t, last_analog6, now_analog6);
      const interp_analog7 = linear(t, last_analog7, now_analog7);
      const interp_battery = linear(t, last_battery, now_battery);
      const interp_heater = now_heater; // No interpolation
      const temperatures = [
        voltage_to_c_10000(interp_analog0),
        voltage_to_c_10000(interp_analog1),
        voltage_to_c_10000(interp_analog2),
        voltage_to_c_5000(interp_analog3),
        voltage_to_c_5000(interp_analog4),
        voltage_to_c_5000(interp_analog5),
        voltage_to_c_5000(interp_analog6),
        voltage_to_c_5000(interp_analog7),
        interp_ms5611_temp
      ];
      if (t == 0) {
        for (let i = 0; i < 9; i++) {
          chart_values[i].push(temperatures[i]);
          if (chart_values[i].length > STRIP_CHART_DURATION + 1) {
            chart_values[i].shift();
          }
        }
        if (EDIT_MODE && time < EDIT_MODE_START_TIME) {
          break;
        }
      }

      ms5611_temperature_celsius().text(interp_ms5611_temp.toFixed(TEMPERATURE_DIGITS));
      ms5611_temperature_celsius().fill(COLOR_LERP(COLD_COLOR, HOT_COLOR, (interp_ms5611_temp - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C)));
      ms5611_temperature_fahrenheit().text(c_to_f(interp_ms5611_temp).toFixed(TEMPERATURE_DIGITS));
      ms5611_temperature_fahrenheit().fill(COLOR_LERP(COLD_COLOR, HOT_COLOR, (interp_ms5611_temp - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C)));
      if (PRESSURE) {
        ms5611_pressure_kpa().text(mBar_to_kPa(interp_ms5611_pres).toFixed(PRESSURE_DIGITS));
        ms5611_pressure_psi().text(mBar_to_psi(interp_ms5611_pres).toFixed(PRESSURE_DIGITS));
        ms5611_pressure_atm().text(mBar_to_atm(interp_ms5611_pres).toFixed(PRESSURE_ATM_DIGITS));
        ms5611_pressure_inHg().text(mBar_to_inHg(interp_ms5611_pres).toFixed(PRESSURE_DIGITS));
      }
      for (let i = 0; i < 8; i++) {
        temperature_celsius[i]().text(temperatures[i].toFixed(TEMPERATURE_DIGITS));
        temperature_celsius[i]().fill(COLOR_LERP(COLD_COLOR, HOT_COLOR, (temperatures[i] - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C)));
        temperature_fahrenheit[i]().text(c_to_f(temperatures[i]).toFixed(TEMPERATURE_DIGITS));
        temperature_fahrenheit[i]().fill(COLOR_LERP(COLD_COLOR, HOT_COLOR, (temperatures[i] - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C)));
      }
      battery_voltage().text(interp_battery.toFixed(BATTERY_DIGITS));
      heater_enabled().fill(interp_heater ? HEATER_ENABLED : HEATER_DISABLED);
      heater_disabled().fill(!interp_heater ? HEATER_ENABLED : HEATER_DISABLED);

      for (let i = 0; i < 9; i++) {
        temperature_rects[i]().fill(COLOR_LERP(COLD_COLOR, HOT_COLOR, (temperatures[i] - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C)));
        temperature_lines[i]().stroke(COLOR_LERP(COLD_COLOR, HOT_COLOR, (temperatures[i] - SCALE_MIN_C) / (SCALE_MAX_C - SCALE_MIN_C)));
      }

      for (let i = 0; i < 9; i++) {
        const points: [number, number][] = [];
        for (let j = 0; j < chart_values[i].length; j++) {
          const past_time = chart_values[i].length - j + t - 1;
          const x = linear(past_time / STRIP_CHART_DURATION, STRIP_CHART_RIGHT, STRIP_CHART_LEFT);
          points.push([x, scale_y_map(chart_values[i][j])]);
        }
        const latest_position: [number, number] = [STRIP_CHART_RIGHT, scale_y_map(temperatures[i])];
        points.push(latest_position);
        strip_chart_lines[i]().points(points);
        if (LEADER_INDEXES) {
          strip_chart_labels[i]().position(latest_position);
        }
      }

      if (!EDIT_MODE || time > EDIT_MODE_START_TIME) {
        yield;
      }
    }

    last_time = time;
  }
});
