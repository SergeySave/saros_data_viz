import {Circle, Line, Txt, Node, makeScene2D} from '@motion-canvas/2d';
import {Color, createRef, linear, usePlayback} from '@motion-canvas/core';
import {slow} from "./slow";
import {gps} from "./gps";

const EDIT_MODE = false;
const EDIT_MODE_START_TIME = 10462; // seconds
const EDIT_MODE_DURATION = 100; // seconds

const FONT_SIZE = 44;
const LABEL_FONT_COLOR = new Color("#FFFFFF");
const FONT_STROKE = 4;
const FONT_STROKE_COLOR = new Color("#000000");
const FONT_STROKE_FIRST = true;
const FONT_FAMILY = "Avenir";
const VALUE_FONT_COLOR = new Color('#FFFFCC');
const UNITS_FONT_COLOR = new Color('#AAAAAA');
const COLUMNS = [
  -1248,
  -750,
  -500,
  752,
  972,
  1248,
];
const START_ROW_HEIGHT = -688;
const ROW_HEIGHT = 62;
const ALTITUDE_ROW = 0;
const VERTICAL_SPEED_ROW = 1;
const GROUND_SPEED_ROW = 3;
const COURSE_ROW = 2;
const DISTANCE_FROM_LAUNCH_ROW = 4;
const PRESSURE_ROW = 2;
const TIMESTAMP_ROW = 0;
const FLIGHT_TIME_ROW = 1;
const ALTITUDE_DIGITS = 0;
const SPEED_DIGITS = 2;
const COURSE_DIGITS = 0;
const DISTANCE_DIGITS = 0;
const PRESSURE_DIGITS = 2;
const PRESSURE_ATM_DIGITS = 4;
const ALTITUDE_GRAPH_LEFT = -1280;
const ALTITUDE_GRAPH_RIGHT = 1280;
const ALTITUDE_GRAPH_TOP = 208;
const ALTITUDE_GRAPH_BOTTOM = 464;
const ALTITUDE_MINIMUM = 200;
const ALTITUDE_MAXIMUM = 30000;
const ALTITUDE_START = 4370;
const ALTITUDE_END = 14160;
const ALTITUDE_GRAPH_COLOR = new Color("#FF0000");
const ALTITUDE_GRAPH_WIDTH = 2;
const ALTITUDE_GRAPH_DOT_SIZE = 16;
const SUN_MOON_SIZE = 128;
const SUN_COLOR = new Color("#FFFF00");
const MOON_COLOR = new Color("#101010");
const CORONA_COLOR = new Color("#A0A0A0");
const MOON_ANGLE = 130;
const SUN_MOON_Y = 592;
const RELEASE_TIME = 4400; // 12:02:12
const RELEASE_REALTIME = [12, 2, 12];
const C1_TIME = RELEASE_TIME + 1098; // 12:23:30
const C2_TIME = RELEASE_TIME + 5750; // 13:38:02
const MAX_ECLIPSE_TIME = RELEASE_TIME + 5876; // 13:40:08
const C3_TIME = RELEASE_TIME + 6002; // 13:42:14
const C4_TIME = RELEASE_TIME + 10711; // 15:00:43

// (12082-4392) = 7690
// 2:08:10
// 14:10:11

function row(pos: number): number {
  return START_ROW_HEIGHT + ROW_HEIGHT * pos;
}

function time_to_index_slow(time: number): [number, number, number, number] {
  const floored = Math.floor(time);
  if (floored < 2) {
    return [0, 0, 15, 2];
  } else {
    return [floored * 15, floored, floored * 15 + 15, floored + 1];
  }
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

function m_to_m(meters: number): number {
  return meters;
}

function m_to_ft(meters: number): number {
  return meters * 3.281;
}

function m_to_km(meters: number): number {
  return meters * 0.001;
}

function m_to_mi(meters: number): number {
  return meters * 6.214e-4;
}

function mps_to_mps(mps: number): number {
  return mps;
}

function mps_to_ftps(mps: number): number {
  return mps * 3.281;
}

function mps_to_kph(mps: number): number {
  return mps * 3.6;
}

function mps_to_mph(mps: number): number {
  return mps * 2.237;
}

function gps_vector_at_index(index: number): [number, number, number] {
  const now_time = gps[index];
  const now_north = gps[index + 1];
  const now_east = gps[index + 2];
  const now_alt = gps[index + 3];
  if (index == 0) {
    const next_time = gps[index + 4];
    const next_north = gps[index + 4 + 1];
    const next_east = gps[index + 4 + 2];
    const next_alt = gps[index + 4 + 3];

    const north_speed = (next_north - now_north) / (next_time - now_time);
    const east_speed = (next_east - now_east) / (next_time - now_time);
    const vertical_speed = (next_alt - now_alt) / (next_time - now_time);
    return [north_speed, east_speed, vertical_speed];
  } else if (index == gps.length - 4) {
    const last_time = gps[index - 4];
    const last_north = gps[index - 4 + 1];
    const last_east = gps[index - 4 + 2];
    const last_alt = gps[index - 4 + 3];

    const north_speed = (now_north - last_north) / (now_time - last_time);
    const east_speed = (now_east - last_east) / (now_time - last_time);
    const vertical_speed = (now_alt - last_alt) / (now_time - last_time);
    return [north_speed, east_speed, vertical_speed];
  }
  const last_time = gps[index - 4];
  const last_north = gps[index - 4 + 1];
  const last_east = gps[index - 4 + 2];
  const next_alt = gps[index + 4 + 3];
  const next_time = gps[index + 4];
  const next_north = gps[index + 4 + 1];
  const next_east = gps[index + 4 + 2];
  const last_alt = gps[index - 4 + 3];

  const north_speed_a = (next_north - now_north) / (next_time - now_time);
  const east_speed_a = (next_east - now_east) / (next_time - now_time);
  const vertical_speed_a = (next_alt - now_alt) / (next_time - now_time);
  const north_speed_b = (now_north - last_north) / (now_time - last_time);
  const east_speed_b = (now_east - last_east) / (now_time - last_time);
  const vertical_speed_b = (now_alt - last_alt) / (now_time - last_time);

  let vertical_speed = (now_time == 12134.6 || now_time == 4400.0) ? (0.0) : (vertical_speed_a + vertical_speed_b) / 2;
  if (now_time == 14016.9) {
    vertical_speed = vertical_speed_b;
  }
  return [(north_speed_a + north_speed_b) / 2, (east_speed_a + east_speed_b) / 2, vertical_speed];
}

function moon_relative_position(time: number): [number, number] {
  return [SUN_MOON_SIZE * Math.cos(-MOON_ANGLE * Math.PI / 180) * time, SUN_MOON_SIZE * Math.sin(-MOON_ANGLE * Math.PI / 180) * time];
}

function time_to_x(time: number): number {
  const x_t = (time - ALTITUDE_START) / (ALTITUDE_END - ALTITUDE_START);
  return linear(x_t, ALTITUDE_GRAPH_LEFT, ALTITUDE_GRAPH_RIGHT);
}

function get_time_string(time: number): string {
  const release_seconds = ((RELEASE_REALTIME[0] * 60) + RELEASE_REALTIME[1]) * 60 + RELEASE_REALTIME[2];
  const now_seconds = release_seconds + time - RELEASE_TIME;
  const seconds = now_seconds % 60;
  const minutes = (now_seconds - seconds) / 60 % 60;
  const hours = ((now_seconds - seconds) / 60 - minutes) / 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toFixed(0).padStart(2, "0")}`
}

function get_flight_time(time: number): string {
  const relative_time = time - RELEASE_TIME;
  const absolute_time = Math.abs(relative_time);
  const seconds = absolute_time % 60;
  const minutes = (absolute_time - seconds) / 60 % 60;
  const hours = ((absolute_time - seconds) / 60 - minutes) / 60;
  return `L${(relative_time < 0) ? '-' : '+'}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toFixed(0).padStart(2, "0")}`
}

export default makeScene2D(function* (view) {
  // Create your animations here
  const fps = usePlayback().fps;

  const altitude_m = createRef<Txt>();
  const altitude_ft = createRef<Txt>();
  const vertical_mps = createRef<Txt>();
  const vertical_ftps = createRef<Txt>();
  const speed_kph = createRef<Txt>();
  const speed_mph = createRef<Txt>();
  const course_deg = createRef<Txt>();
  const distance_km = createRef<Txt>();
  const distance_mi = createRef<Txt>();
  const pressure_kpa = createRef<Txt>();
  const pressure_psi = createRef<Txt>();
  const pressure_atm = createRef<Txt>();
  const pressure_inhg = createRef<Txt>();
  const position_circle = createRef<Circle>();
  const timestamp = createRef<Txt>();
  const flight_time = createRef<Txt>();

  view.add(<>
    <Txt text={"Altitude (MSL)"} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[0], row(ALTITUDE_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={altitude_m} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(ALTITUDE_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"m"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(ALTITUDE_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={altitude_ft} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(ALTITUDE_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"ft"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(ALTITUDE_ROW)]} offset={[-1, -1]}></Txt>

    <Txt text={"Vertical Speed"} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[0], row(VERTICAL_SPEED_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={vertical_mps} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(VERTICAL_SPEED_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"m/s"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(VERTICAL_SPEED_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={vertical_ftps} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(VERTICAL_SPEED_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"ft/s"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(VERTICAL_SPEED_ROW)]} offset={[-1, -1]}></Txt>

    <Txt text={"Ground Speed"} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[0], row(GROUND_SPEED_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={speed_kph} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(GROUND_SPEED_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"kph"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(GROUND_SPEED_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={speed_mph} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(GROUND_SPEED_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"mph"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(GROUND_SPEED_ROW)]} offset={[-1, -1]}></Txt>

    <Txt text={"Course"} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[0], row(COURSE_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={course_deg} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(COURSE_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"°"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(COURSE_ROW)]} offset={[-1, -1]}></Txt>

    <Txt text={"Distance"} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[0], row(DISTANCE_FROM_LAUNCH_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={distance_km} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(DISTANCE_FROM_LAUNCH_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"km"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[1], row(DISTANCE_FROM_LAUNCH_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={distance_mi} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(DISTANCE_FROM_LAUNCH_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"mi"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[2], row(DISTANCE_FROM_LAUNCH_ROW)]} offset={[-1, -1]}></Txt>

    <Txt text={"Pressure"} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[5], row(PRESSURE_ROW+0.5)]} offset={[1, -1]}></Txt>
    <Txt ref={pressure_kpa} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[3], row(PRESSURE_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"kPa"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[3], row(PRESSURE_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={pressure_psi} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(PRESSURE_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"psi"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(PRESSURE_ROW)]} offset={[-1, -1]}></Txt>
    <Txt ref={pressure_atm} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[3], row(PRESSURE_ROW + 1)]} offset={[1, -1]}></Txt>
    <Txt text={"atm"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[3], row(PRESSURE_ROW + 1)]} offset={[-1, -1]}></Txt>
    <Txt ref={pressure_inhg} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(PRESSURE_ROW + 1)]} offset={[1, -1]}></Txt>
    <Txt text={"inHg"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(PRESSURE_ROW + 1)]} offset={[-1, -1]}></Txt>

    <Txt text={"Time"} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[5], row(TIMESTAMP_ROW+0.5)]} offset={[1, -1]}></Txt>
    <Txt ref={timestamp} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(TIMESTAMP_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"CDT"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(TIMESTAMP_ROW)]} offset={[-1, -1]}></Txt>
    <Txt text={""} fontFamily={FONT_FAMILY} fill={LABEL_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[5], row(FLIGHT_TIME_ROW)]} offset={[1, -1]}></Txt>
    <Txt ref={flight_time} fontFamily={FONT_FAMILY} fill={VALUE_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(FLIGHT_TIME_ROW)]} offset={[1, -1]}></Txt>
    <Txt text={"MET"} fontFamily={FONT_FAMILY} fill={UNITS_FONT_COLOR} fontSize={FONT_SIZE} stroke={FONT_STROKE_COLOR} lineWidth={FONT_STROKE} strokeFirst={FONT_STROKE_FIRST} position={[COLUMNS[4], row(FLIGHT_TIME_ROW)]} offset={[-1, -1]}></Txt>
  </>);

  const altitude_graph: [number, number][] = [];
  for (let gps_index = 0; gps_index < gps.length; gps_index += 4) {
    const time = gps[gps_index];
    const altitude = gps[gps_index + 3];

    const x_t = (time - ALTITUDE_START) / (ALTITUDE_END - ALTITUDE_START);
    const x = linear(x_t, ALTITUDE_GRAPH_LEFT, ALTITUDE_GRAPH_RIGHT);

    const y_t = (altitude - ALTITUDE_MINIMUM) / (ALTITUDE_MAXIMUM - ALTITUDE_MINIMUM);
    const y = linear(y_t, ALTITUDE_GRAPH_BOTTOM, ALTITUDE_GRAPH_TOP);

    altitude_graph.push([x, y]);
  }
  view.add(<>
    <Line stroke={ALTITUDE_GRAPH_COLOR} lineWidth={ALTITUDE_GRAPH_WIDTH} points={altitude_graph}></Line>
    <Circle ref={position_circle} fill={ALTITUDE_GRAPH_COLOR} size={ALTITUDE_GRAPH_DOT_SIZE}></Circle>
  </>);

  view.add(<Node cache position={[time_to_x(C1_TIME), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(-1)}></Circle>
  </Node>);
  view.add(<Node cache position={[time_to_x(linear(0.2, C1_TIME, C2_TIME)), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(-0.8)}></Circle>
  </Node>);
  view.add(<Node cache position={[time_to_x(linear(0.4, C1_TIME, C2_TIME)), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(-0.6)}></Circle>
  </Node>);
  view.add(<Node cache position={[time_to_x(linear(0.6, C1_TIME, C2_TIME)), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(-0.4)}></Circle>
  </Node>);
  view.add(<Node cache position={[time_to_x(linear(0.8, C1_TIME, C2_TIME)), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(-0.2)}></Circle>
  </Node>);
  view.add(<>
    <Circle size={SUN_MOON_SIZE+2+8} fill={CORONA_COLOR} position={[time_to_x(MAX_ECLIPSE_TIME), SUN_MOON_Y]}></Circle>
    <Node cache position={[time_to_x(MAX_ECLIPSE_TIME), SUN_MOON_Y]}>
      <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
      <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(0)}></Circle>
    </Node>
  </>);
  view.add(<Node cache position={[time_to_x(linear(0.2, C3_TIME, C4_TIME)), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(0.2)}></Circle>
  </Node>);
  view.add(<Node cache position={[time_to_x(linear(0.4, C3_TIME, C4_TIME)), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(0.4)}></Circle>
  </Node>);
  view.add(<Node cache position={[time_to_x(linear(0.6, C3_TIME, C4_TIME)), SUN_MOON_Y]}>
    <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
    <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(0.6)}></Circle>
  </Node>);
  // view.add(<Node cache position={[time_to_x(linear(0.8, C3_TIME, C4_TIME)), SUN_MOON_Y]}>
  //   <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
  //   <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(0.8)}></Circle>
  // </Node>);
  // view.add(<Node cache position={[time_to_x(C4_TIME), SUN_MOON_Y]}>
  //   <Circle size={SUN_MOON_SIZE} fill={SUN_COLOR}></Circle>
  //   <Circle size={SUN_MOON_SIZE+2} fill={MOON_COLOR} compositeOperation={"source-atop"} position={moon_relative_position(1)}></Circle>
  // </Node>);

  let last_gps_index = 0;
  const final_index = EDIT_MODE ? (EDIT_MODE_START_TIME + EDIT_MODE_DURATION)*fps + 1 : 15000*fps;
  for (let frame_number = 0; frame_number < final_index; frame_number++) {
    const current_time = frame_number / fps;
    const [before_index, before_time, after_index, after_time] = time_to_index_slow(current_time);
    const slow_interp = (current_time - before_time) / (after_time - before_time);
    const pressure_sensor = linear(slow_interp, slow[before_index + 2] as number, slow[after_index + 2] as number);

    if (((last_gps_index + 8) < gps.length) && (gps[last_gps_index + 4] < current_time)) {
      last_gps_index += 4;
    }
    const next_gps_index = last_gps_index + 4;
    const gps_interp = (current_time - gps[last_gps_index]) / (gps[next_gps_index] - gps[last_gps_index]);
    const east = linear(gps_interp, gps[last_gps_index + 1] as number, gps[next_gps_index + 1] as number);
    const north = linear(gps_interp, gps[last_gps_index + 2] as number, gps[next_gps_index + 2] as number);
    const alt = linear(gps_interp, gps[last_gps_index + 3] as number, gps[next_gps_index + 3] as number);
    const distance = Math.hypot(east, north);

    const last_gps_vector = gps_vector_at_index(last_gps_index);
    const next_gps_vector = gps_vector_at_index(next_gps_index);
    const north_speed = linear(gps_interp, last_gps_vector[0], next_gps_vector[0]);
    const east_speed = linear(gps_interp, last_gps_vector[1], next_gps_vector[1]);
    const vertical_speed = linear(gps_interp, last_gps_vector[2], next_gps_vector[2]);
    const ground_speed = Math.hypot(north_speed, east_speed);
    let course = Math.atan2(east_speed, north_speed) * 180 / Math.PI;
    if (course < 0) {
      course += 360;
    }
    let courseText = (ground_speed < 0.0894) ? ("N/A") : course.toFixed(COURSE_DIGITS);

    const now_time = RELEASE_REALTIME;

    altitude_m().text(m_to_m(alt).toFixed(ALTITUDE_DIGITS));
    altitude_ft().text(m_to_ft(alt).toFixed(ALTITUDE_DIGITS));
    vertical_mps().text(mps_to_mps(vertical_speed).toFixed(SPEED_DIGITS));
    vertical_ftps().text(mps_to_ftps(vertical_speed).toFixed(SPEED_DIGITS));
    speed_kph().text(mps_to_kph(ground_speed).toFixed(SPEED_DIGITS));
    speed_mph().text(mps_to_mph(ground_speed).toFixed(SPEED_DIGITS));
    course_deg().text(courseText);
    distance_km().text(m_to_km(distance).toFixed(DISTANCE_DIGITS));
    distance_mi().text(m_to_mi(distance).toFixed(DISTANCE_DIGITS));
    pressure_kpa().text(mBar_to_kPa(pressure_sensor).toFixed(PRESSURE_DIGITS));
    pressure_psi().text(mBar_to_psi(pressure_sensor).toFixed(PRESSURE_DIGITS));
    pressure_atm().text(mBar_to_atm(pressure_sensor).toFixed(PRESSURE_ATM_DIGITS));
    pressure_inhg().text(mBar_to_inHg(pressure_sensor).toFixed(PRESSURE_DIGITS));

    timestamp().text(get_time_string(current_time));
    flight_time().text(get_flight_time(current_time));

    const x = time_to_x(current_time);
    const y_t = (alt - ALTITUDE_MINIMUM) / (ALTITUDE_MAXIMUM - ALTITUDE_MINIMUM);
    const y = linear(y_t, ALTITUDE_GRAPH_BOTTOM, ALTITUDE_GRAPH_TOP);
    position_circle().position([x, y]);

    if (!EDIT_MODE || current_time > EDIT_MODE_START_TIME) {
      yield;
    }
  }
});
