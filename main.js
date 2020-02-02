var gamma = require('gamma');
var chartjs = require('chart.js');
var dataset = require('./data.json');

function ParseData(dataset){
    var data = dataset.data;
    var opt = 0;
    var pes = 0;
    data.forEach(function(value){
        if(value.size == "XS"){
            opt = Math.min(...value.completionTimes);
            pes = Math.max(...value.completionTimes);
        }
    })

    return [opt, pes];
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
//var standardDeviation = GetStandardDeviation();
//var expectedValue = GetExpectedValue();
var standardDeviation2 = 2.41;
var expectedValue2 = 5.44;
//var opt = 2*8;
//var mode = 4*8;
//var pes = 10*8;

//var delta = 4;
var [opt, pes] = ParseData(dataset);
var delta = (pes - opt)/standardDeviation2 - 2;
var deltaPrim = (pes - opt) / standardDeviation2;
var mode = (expectedValue2 * deltaPrim - pes - opt)/(deltaPrim - 2)

console.log(mode);
var expectedValue = (opt + delta * mode + pes ) / (2 + delta);
var standardDeviation = (pes - opt) / (2 + delta);
console.log("Expected value: " + expectedValue + " with delta = " + delta);
console.log("Standard deviation: " + standardDeviation);

var timeOfWork = GenerateTimeOfWork(opt, pes);
var [alfa1, alfa2, betaDistribution] = CalculateConstants(opt, mode, pes);
var pertPDF = CalculatePDF(timeOfWork);
var pertCDF = CalculateCDF(pertPDF);
//var sum = densityFunction.reduce((a,b)=> a + b, 0);
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