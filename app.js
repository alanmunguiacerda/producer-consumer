const KEY_EVENTS = {
  esc: 'stopSimulation',
};

const bus = new Vue();

class BaseWorker {
  constructor() {
    this.idx = 0;
    this.sleepT = 0;
    this.sleepInterval = null;
    this.awake();
  }

  sleep(ticks) {
    if (this.sleepInterval) return;
    this.sleepT = ticks;
    this.status = STATUS_SLEEP;
    this.sleepInterval = setInterval(() => {
      this.sleepT -= 1;
      if (!this.sleepT) {
        clearInterval(this.sleepInterval);
        this.sleepInterval = null;
        this.awake();
      }
    }, TICK_INTERVAL);
  }

  awake() {
    this.status = STATUS_AWAKE;
  }

  isAwake() {
    return this.status === STATUS_AWAKE;
  }

  isAsleep() {
    return this.status === STATUS_SLEEP;
  }
  
  increaseIndex() {
    this.idx = (this.idx + 1) % CONTAINER_SIZE; 
  }
}

class Producer extends BaseWorker {
  produce(container) {
    if (container[this.idx]) {
      this.sleep(getRandomInt(MIN_P, MAX_P));
      return;
    }
    container[this.idx] = getRandomColor();
    this.toProduce -= 1;
    this.increaseIndex();
  }
  
  getStatusStr() {
    let text = this.status;
    
    if (this.isAsleep()) {
      text += ` - ${this.sleepT} ticks remaining`;
      return text;
    }
    
    if (this.isAwake()) {
      text += ` - producing ${this.toProduce}`;
      return text;
    }
    return 'KAKA';
  }
  
  get toProduce() {
    return this._toProduce;
  }
  
  set toProduce(toProduce) {
    this._toProduce = toProduce;
  }
}

class Consumer extends BaseWorker {
  consume(container) {
    if (!container[this.idx]) {
      this.sleep(getRandomInt(MIN_P, MAX_P));
      return;
    }
    container[this.idx] = '';
    this.toConsume -= 1;
    this.increaseIndex();
  }
  
  getStatusStr() {
    let text = this.status;
    
    if (this.isAsleep()) {
      text += ` - ${this.sleepT} ticks remaining`;
      return text;
    }
    
    if (this.isAwake()) {
      text += ` - consuming ${this.toConsume}`;
      return text;
    }
    return 'KAKA';
  }
  
  get toConsume() {
    return this._toConsume;
  }
  
  set toConsume(toConsume) {
    this._toConsume = toConsume;
  }
}

const app = new Vue({
  el: '#app',
  data: {
    container: {},
    producer: new Producer(),
    consumer: new Consumer(),
    timerInterval: null,
  },
  methods: {
    startSimulation: function() {
      if (this.timerInterval) return;

      this.timerInterval = setInterval(() => {
        if (this.producer.isAwake() && this.producer.toProduce) {
          this.producer.produce(this.container);
        } else if (!this.producer.toProduce) {
          this.producer.sleep(getRandomInt(MIN_P, MAX_P));
          this.producer.toProduce = getRandomInt(MIN_P, MAX_P);
        }

        if (this.consumer.isAwake() && this.consumer.toConsume) {
          this.consumer.consume(this.container);
        } else if (!this.consumer.toConsume) {
          this.consumer.sleep(getRandomInt(MIN_P, MAX_P));
          this.consumer.toConsume = getRandomInt(MIN_P, MAX_P);
        }
      }, TICK_INTERVAL);
    },
    stopSimulation: function() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    },
  },
  created() {
    for (let i = 0; i < CONTAINER_SIZE; i++) {
      Vue.set(this.container, i, '');
    }
    this.startSimulation();
  },
  mounted() {
    Object.values(KEY_EVENTS).forEach(v => bus.$on(v, this[v]));
  },
});

const keyListener = new window.keypress.Listener();

Object.keys(KEY_EVENTS).forEach(k => keyListener.simple_combo(k, () => bus.$emit(KEY_EVENTS[k])));