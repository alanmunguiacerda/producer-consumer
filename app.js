const KEY_EVENTS = {
  esc: 'stopSimulation',
};

const bus = new Vue();

class BaseWorker {
  constructor(container) {
    this.container = container;
    this.idx = 0;
    this.sleepT = 0;
    this.sleepInterval = null;
    this._toWork = getRandomInt(MIN_P, MAX_P);
  }

  sleep(reason = STATUS_SLEEP) {
    if (this.sleepInterval) return;
    this.sleepT = getRandomInt(MIN_P, MAX_P);

    this.status = reason;
    if (reason !== STATUS_SLEEP) {
      setTimeout(() => {
        this.status = STATUS_SLEEP;
      }, TICK_INTERVAL);
    }

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
    const eventName = `${this.constructor.name}Awoke`;
    bus.$emit(eventName);
  }

  isAwake() {
    return this.status === STATUS_AWAKE;
  }

  isAsleep() {
    return this.status === STATUS_SLEEP || this.isBufferBusy();
  }
  
  isBufferBusy() {
    return this.status === STATUS_BUFFER_BUSY;
  }

  cantUseBuffer() {
    return this.status === STATUS_BUFFER_UNUSABLE;
  }

  increaseIndex() {
    this.idx = (this.idx + 1) % CONTAINER_SIZE; 
  }
  
  get toWork() {
    return this._toWork;
  }
  
  set toWork(toWork) {
    this._toWork = toWork;
  }
  
  getStatusStr() {
    if (this.isAsleep() || this.isBufferBusy() || this.cantUseBuffer()) {
      let text = `sleep (${this.sleepT} ticks remaining) `;
      if (this.isBufferBusy()) text += 'buffer is being used';
      else if (this.cantUseBuffer()) text += this.constructor.name === 'Producer' 
        ? 'buffer is full' 
        : 'buffer is empty';
      return text;
    }

    if (this.isAwake()) {
      const jobType = this.constructor.name === 'Producer' ? 'producing' : 'consuming';
      return `awake (${jobType} ${this.toWork})`;
    }
  }
}

class Producer extends BaseWorker {
  work() {
    if (!this.canWork()) {
      this.sleep(STATUS_BUFFER_UNUSABLE);
      return;
    }
    this.container[this.idx] = getRandomColor();
    this.toWork -= 1;
    this.increaseIndex();
  }
  
  canWork() {
    return !this.container[this.idx];
  }
}

class Consumer extends BaseWorker {
  work() {
    if (!this.canWork()) {
      this.sleep(STATUS_BUFFER_UNUSABLE);
      return;
    }
    this.container[this.idx] = '';
    this.toWork -= 1;
    this.increaseIndex();
  }
  
  canWork() {
    return !!this.container[this.idx];
  }
}

const app = new Vue({
  el: '#app',
  data: {
    container: {},
    producer: null,
    consumer: null,
    timerInterval: null,
  },
  methods: {
    startSimulation: function() {
      if (this.timerInterval) return;

      this.producer.sleep();
      this.consumer.sleep();

      let worker = null;
      
      bus.$on('ProducerAwoke', () => {
        console.log('try to set Producer as worker');
        if (this.consumer.isAwake()) {
          this.producer.sleep(STATUS_BUFFER_BUSY);
          return;
        }

        if (!this.producer.canWork()) {
          this.producer.sleep(STATUS_BUFFER_UNUSABLE);
          return;
        }

        worker = this.producer;
      });
      bus.$on('ConsumerAwoke', () => {
        console.log('try to set Consumer as worker');
        if (this.producer.isAwake()) {
          this.consumer.sleep(STATUS_BUFFER_BUSY);
          return;
        }
        
        if (!this.consumer.canWork()) {
          this.consumer.sleep(STATUS_BUFFER_UNUSABLE);
          return;
        }

        worker = this.consumer;
      });

      this.timerInterval = setInterval(() => {
        if (!worker) {
          console.log('No worker');
          return;
        }

        if (worker.isAwake() && worker.toWork) {
          worker.work();
        } else if (!worker.toWork) {
          worker.sleep();
          worker.toWork = getRandomInt(MIN_P, MAX_P);
          worker = null;
        }
      }, TICK_INTERVAL);
    },
    stopSimulation: function() {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
        bus.$off('ProducerAwoke');
        bus.$off('ConsumerAwoke');
      }
    },
  },
  created() {
    for (let i = 0; i < CONTAINER_SIZE; i++) {
      Vue.set(this.container, i, '');
    }
    this.producer = new Producer(this.container);
    this.consumer = new Consumer(this.container);
    this.startSimulation();
  },
  mounted() {
    Object.values(KEY_EVENTS).forEach(v => bus.$on(v, this[v]));
  },
});

const keyListener = new window.keypress.Listener();

Object.keys(KEY_EVENTS).forEach(k => keyListener.simple_combo(k, () => bus.$emit(KEY_EVENTS[k])));