var gamma = require('gamma');
var chartjs = require('chart.js');
var dataset = require('./data.json');

function ParseData(dataset){
    var data = dataset.data;
    var opt = 0;
    var pes = 0;
    var completionTimes = [];
    data.forEach(function(value){
        if(value.size == "XS"){
            opt = Math.min(...value.completionTimes);
            pes = Math.max(...value.completionTimes);
            completionTimes = value.completionTimes;
        }
    })

    var completionTimesCount = completionTimes.length;
    var expectedValue = completionTimes.reduce((a,b) => a + b, 0) / completionTimesCount;
    var standardDeviation = Math.sqrt(completionTimes.reduce((sq, n) => sq + Math.pow(n - expectedValue, 2), 0) / (completionTimesCount - 1));

    return [opt, pes, expectedValue, standardDeviation];
}

function GenerateTimeOfWork(opt, pes){
    var timeOfWork = new Array(pes - opt + 1);
    timeOfWork[0] = opt;
    for (i = 1; i < timeOfWork.length; i++){
        timeOfWork[i] = timeOfWork[i-1] + 1;
    }
    return timeOfWork;
}

function CalculateConstants(opt, mode, pes){
    var alfa1 = (4*mode + pes - 5*opt) / (pes - opt);
    var alfa2 = (5*pes - opt - 4*mode) / (pes - opt);
    var betaDistribution = gamma(alfa1) * gamma(alfa2) / gamma(alfa1 + alfa2);
    return [alfa1, alfa2, betaDistribution];
}

function CalculatePDF(timeOfWork){
    var pertPDF = new Array(timeOfWork.length);
    timeOfWork.forEach(function(value, index){
        var top = ((value - opt)**(alfa1 - 1)) * ((pes - value)**(alfa2 - 1));
        var bottom = (pes - opt)**(alfa1 + alfa2 - 1);
        pertPDF[index] =  (1 / betaDistribution) * top / bottom;
    });
    return pertPDF;
}

function CalculateCDF(densityFunction){
    var cumulativeFunction = new Array(densityFunction.length);
    cumulativeFunction[0] = densityFunction[0];
    for (i = 1; i < densityFunction.length; i++){
        cumulativeFunction[i] = cumulativeFunction[i-1] + densityFunction[i];
    }
    return cumulativeFunction;
}

//data
var [opt, pes, expectedValue, standardDeviation] = ParseData(dataset);
var delta = (pes - opt)/standardDeviation - 2;
var mode = expectedValue + (2 * expectedValue - opt - pes) / delta;

console.log("Most likely time to complete the task: " + mode);
console.log("Expected value: " + expectedValue + " with delta = " + delta);
console.log("Standard deviation: " + standardDeviation);


// https://dev.azure.com/michalkluz/LunchHunch/_apis/wit/workitems?ids=1&api-version=5.1
// PAT ng5exbsqcnbklgljt7bzcw5rkv5yuifbhfrd7j2l3xnw3rk3laxa


var timeOfWork = GenerateTimeOfWork(opt, pes);
var [alfa1, alfa2, betaDistribution] = CalculateConstants(opt, mode, pes);
var pertPDF = CalculatePDF(timeOfWork);
var pertCDF = CalculateCDF(pertPDF);
console.log(pertPDF);
console.log(pertCDF);

var PDFCtx = document.getElementById('PDF').getContext('2d');
var PDFChart = new Chart(PDFCtx, {
    type: 'line',
    data: {
        labels: timeOfWork,
        datasets: [{
            label: 'PDF',
            data: pertPDF,
            borderWidth: 1
        }]
    }
});
var CDFCtx = document.getElementById('CDF').getContext('2d');
var CDFChart = new Chart(CDFCtx, {
    type: 'line',
    data: {
        labels: timeOfWork,
        datasets: [{
            label: 'CDF',
            data: pertCDF,
            borderWidth: 1
        }]
    }
});

console.log(pertPDF);