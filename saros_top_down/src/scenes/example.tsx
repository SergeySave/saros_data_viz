import {Circle, Img, Layout, makeScene2D, Line} from '@motion-canvas/2d';
import {all, Color, createRef, linear, useLogger} from '@motion-canvas/core';
import {data} from "./data";

const EDIT_MODE = false;
const EDIT_MODE_START_TIME = 10000; // seconds
const EDIT_MODE_DURATION = 500; // seconds
const DECIMATE = EDIT_MODE ? 100 : 1;
const MINIMUM_DISTANCE = 5;
const POSITION_SIZE = 16;
const LAUNCH_POSITION = [-250, 265];
const LANDING_POSITION = [280, -157];
// const LAUNCH_POSITION = [-230, 195];
// const LANDING_POSITION = [135, -86];
const LAUNCH_COORDINATES = [0, 0];
const LANDING_COORDINATES = [160065.567761877,128712.17902356156];
const SHADOW_RADIUS_METERS = 98000; // 98km
const SHADOW_COLOR = new Color("#000000A0");
const LAUNCH_LAT_LON = [30.733952, -98.3741696];
const LANDING_LAT_LON = [31.8839936, -96.6821184];
const SPEED = 0.485;
const ANGLE = 62.6 * Math.PI / 180.0;
const OFFSET = [11.7, 134.95];
const TEMPORAL_OFFSET = -83.4+0.5;
const ZOOM = 1;

function position_mapping(x: number, y: number): [number, number] {
  let t_x = (x - LAUNCH_COORDINATES[0]) / (LANDING_COORDINATES[0] - LAUNCH_COORDINATES[0]);
  let t_y = (y - LAUNCH_COORDINATES[1]) / (LANDING_COORDINATES[1] - LAUNCH_COORDINATES[1]);
  return [linear(t_x, LAUNCH_POSITION[0], LANDING_POSITION[0]), linear(t_y, LAUNCH_POSITION[1], LANDING_POSITION[1])];
}

function lat_lon_position_mapping(x: number, y: number): [number, number] {
  let t_x = (x - LAUNCH_LAT_LON[0]) / (LANDING_LAT_LON[0] - LAUNCH_LAT_LON[0]);
  let t_y = (y - LAUNCH_LAT_LON[1]) / (LANDING_LAT_LON[1] - LAUNCH_LAT_LON[1]);
  return [linear(t_x, LAUNCH_POSITION[0], LANDING_POSITION[0]), linear(t_y, LAUNCH_POSITION[1], LANDING_POSITION[1])];
}

const METERS_TOTAL = Math.hypot(LANDING_COORDINATES[0] - LAUNCH_COORDINATES[0], LANDING_COORDINATES[1] - LAUNCH_COORDINATES[1]);
const PIXELS_TOTAL = Math.hypot(LANDING_POSITION[0] - LAUNCH_POSITION[0], LANDING_POSITION[1] - LAUNCH_POSITION[1]);
const METERS_PER_PIXEL = METERS_TOTAL / PIXELS_TOTAL;
const SHADOW_RADIUS_PIXELS = SHADOW_RADIUS_METERS / METERS_PER_PIXEL;

function eclipse_position(time: number): [number, number] {
  // 0.282*T+4.08279 Lat
  // 0.329*T-129.612 Lon
  const t = time / 60 + TEMPORAL_OFFSET;
  // const lat = 0.2721*t + 4.69279;
  // const lon = 0.3484*t - 131.122;

  const lat = SPEED * Math.cos(ANGLE) * t + OFFSET[0];
  const lon = SPEED * Math.sin(ANGLE) * t - OFFSET[1];
  const result = lat_lon_position_mapping(lat, lon);
  return [result[0] / ZOOM, result[1] / ZOOM];
}

export default makeScene2D(function* (view) {
  const circle = createRef<Circle>();
  const paths = createRef<Layout>();
  const shadow = createRef<Circle>();
  const logger = useLogger();

  view.add(<>
    <Img src={'/new_map.png'} position={[10,0]} scale={0.5}></Img>
    {/*<Img src={'/eclipse_map_2024_QR.png'} position={[-200,-1800]} scale={0.6}></Img>*/}
    <Layout ref={paths}></Layout>
    <Circle ref={circle} size={POSITION_SIZE} fill={'red'}></Circle>
    <Circle ref={shadow} size={SHADOW_RADIUS_PIXELS*2} fill={SHADOW_COLOR}></Circle>
  </>);

  let line_segments: Line[][] = [];
  {
    let total = 0;
    line_segments.push([]);
    let last_position: [number, number] = [0, 0];
    for (let i = 0; i < data.length; i+=4*DECIMATE) {
      const time = Math.min(data[i], 15000 - 1/30);
      const position = position_mapping(data[i + 1], data[i + 2]);
      let last_included = false;
      if (i != 0) {
        const initial_time = EDIT_MODE ? ((time < EDIT_MODE_START_TIME) ? 1 : 0) : 0;
        if (EDIT_MODE && !last_included && initial_time != 1) {
          last_included = true;
          circle().position(last_position);
          shadow().position(eclipse_position(time));
        }
        if (Math.hypot(position[0] - last_position[0], position[1] - last_position[1]) < MINIMUM_DISTANCE) {
          line_segments.push([]);
          continue;
        }
        const past = (<Line lineWidth={2} stroke={'#FF0000'} points={[last_position, position]} end={initial_time}
                            lineCap={'round'}></Line>) as Line;
        const future = (<Line lineWidth={2} stroke={'#0000FF'} points={[last_position, position]} start={initial_time}
                            lineCap={'round'}></Line>) as Line;
        paths().add(past);
        paths().add(future);
        line_segments.push([past, future]);
        total++;
      }
      last_position = position;
    }
    logger.info(`${total}`);
  }

  const start_time = EDIT_MODE ? EDIT_MODE_START_TIME : 0;
  const start_index = Math.floor(start_time / 10) * 4;
  const end_time = EDIT_MODE ? EDIT_MODE_START_TIME + EDIT_MODE_DURATION : 15000;
  let last_time = data[start_index];
  for (let i = start_index; i < data.length; i+=4*DECIMATE) {
    const segment = i / 4 / DECIMATE;
    const time = Math.min(data[i], end_time - 1/30);
    const position = position_mapping(data[i+1], data[i+2]);
    const delta_t = time - last_time;

    if (line_segments[segment].length > 0) {
      yield* all(
          circle().position(position, delta_t, linear),
          line_segments[segment][0].end(1, delta_t, linear),
          line_segments[segment][1].start(1, delta_t, linear),
          shadow().position(eclipse_position(time), delta_t, linear),
      );
    } else {
      yield* all(
          circle().position(position, delta_t, linear),
          shadow().position(eclipse_position(time), delta_t, linear),
      );
    }

    if (EDIT_MODE && (time > end_time)) {
      break;
    }

    last_time = time;
  }
});

