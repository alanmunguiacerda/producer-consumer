const TICK_INTERVAL = 2000;
const TICK_VALUE = TICK_INTERVAL / 1000;
const CONTAINER_SIZE = 35;
const MIN_P = 3;
const MAX_P = 10;
const STATUS_SLEEP = 0;
const STATUS_BUFFER_BUSY = 1;
const STATUS_BUFFER_UNUSABLE = 2;
const STATUS_AWAKE = 3;
const COLORS = [
  '#cd84f1',
  '#ffcccc',
  '#ff4d4d',
  '#ffaf40',
  '#fffa65',
  '#c56cf0',
  '#ffb8b8',
  '#ff3838',
  '#ff9f1a',
  '#7d5fff',
  '#7efff5',
  '#3ae374',
  '#67e6dc',
  '#7158e2',
];
const getRandomInt = (min, max) => {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return Math.floor(Math.random() * Math.floor(max - min) + min);
};

const getRandomColor = () => {
  return COLORS[getRandomInt(COLORS.length)];
}

const isEqOrGr = (a, b) => Number(a.toFixed(FX)) >= Number(b.toFixed(FX));
