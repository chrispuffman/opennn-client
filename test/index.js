var session = new OpenNN.Session();
var trainingSet = [
  {
    "input": [0,0],
    "output": [0]
  },
  {
    "input": [0,1],
    "output": [-1]
  },
  {
    "input": [1,0],
    "output": [1]
  },
  {
    "input": [1,1],
    "output": [0]
  }
];
var trainingConfig = {
  "rate": 0.1,
  "iterations": 100000,
  "error": 0.005,
  "shuffle": true,
  "cost": "cross-entropy"
};
var activationSet = [
  [0, 0],
  [1, 0],
  [1, 1],
  [0, 1]
];
var range = {
  from: -1,
  to: 1
};

session.ready().then(function() {
  session.createPerceptron(2, 2, 1).then(function(result) {
    var network = result.id;
    session.createTrainer(network).then(function(result) {
      var trainer = result.id;
      session.train(trainer, trainingSet, trainingConfig, range).then(function(result) {
        session.activateAll(network, activationSet, range).then(function(result) {
          result.forEach(function(r, i) {
            console.log(activationSet[i], Math.round(r.result[0]));
          });
        });
      });
    });
  });
});
