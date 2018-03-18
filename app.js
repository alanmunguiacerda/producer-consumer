const KEY_EVENTS = {
  esc: 'stopSimulation',
};

const bus = new Vue();

class BaseWorker {
  constructor() {
    this.idx = 0;
    this.sleepT = 0;
    this.sleepInterval = null;
    this._toWork = getRandomInt(MIN_P, MAX_P);
  }

  sleep(triedToWork = false) {
    if (this.sleepInterval) return;
    this.sleepT = getRandomInt(MIN_P, MAX_P);
    
    if (triedToWork) {
      this.status = STATUS_CANT_WORK;
      setTimeout(() => {
        this.status = STATUS_SLEEP;
      }, TICK_INTERVAL);
    } else {
      this.status = STATUS_SLEEP;
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
    console.log(eventName);
    bus.$emit(eventName);
  }

  isAwake() {
    return this.status === STATUS_AWAKE;
  }

  isAsleep() {
    return this.status === STATUS_SLEEP || this.cantWork();
  }
  
  cantWork() {
    return this.status === STATUS_CANT_WORK;
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
}

class Producer extends BaseWorker {
  work(container) {
    if (container[this.idx]) {
      this.sleep();
      return;
    }
    container[this.idx] = getRandomColor();
    this.toWork -= 1;
    this.increaseIndex();
  }

  getStatusStr() {
    if (this.isAsleep() || this.cantWork()) {
      return `sleep (${this.sleepT} ticks remaining) ${this.cantWork() ? 'tried to work' : ''}`;
    }

    if (this.isAwake()) {
      return `awake (producing ${this.toWork})`;
    }
  }
}

class Consumer extends BaseWorker {
  work(container) {
    if (!container[this.idx]) {
      this.sleep();
      return;
    }
    container[this.idx] = '';
    this.toWork -= 1;
    this.increaseIndex();
  }
  
  getStatusStr() {
    if (this.isAsleep() || this.cantWork()) {
      return `sleep (${this.sleepT} ticks remaining) ${this.cantWork() ? 'tried to work' : ''}`;
    }
    
    if (this.isAwake()) {
      return `awake (consuming ${this.toWork})`;
    }
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

      this.producer.sleep();
      this.consumer.sleep();

      let worker = null;
      
      bus.$on('ProducerAwoke', () => {
        console.log('try to set Producer as worker');
        if (this.consumer.isAwake()) {
          this.producer.sleep(true);
          return;
        }
        
        worker = this.producer;
      });
      bus.$on('ConsumerAwoke', () => {
        console.log('try to set Consumer as worker');
        if (this.producer.isAwake()) {
          this.consumer.sleep(true);
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
          worker.work(this.container);
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
    this.startSimulation();
  },
  mounted() {
    Object.values(KEY_EVENTS).forEach(v => bus.$on(v, this[v]));
  },
});

const keyListener = new window.keypress.Listener();

Object.keys(KEY_EVENTS).forEach(k => keyListener.simple_combo(k, () => bus.$emit(KEY_EVENTS[k])));