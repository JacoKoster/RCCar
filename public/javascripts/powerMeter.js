var powerFront = null;
var powerMeter = null;
var powerArc = null;
var formatPercent = d3.format('.0%');
var powerTwoPi = Math.PI * 0.9;

var PowerMeter = function() {

    var radius = 50;
    var border = 5;
    var padding = 10;
    var progress = 0;

    var boxSize = (radius + padding) * 2;

    powerArc = d3.svg.arc()
        .startAngle(0)
        .innerRadius(radius)
        .outerRadius(radius - border - 10);

    var parent = d3.select('.power-meter');

    var svg = parent.append('svg')
        .attr('width', boxSize / 1.5)
        .attr('height', boxSize);

    var defs = svg.append('defs');

    var gradient = defs.append('linearGradient')
        .attr('id', 'gradient')
        .attr('x1', '0')
        .attr('x2', '0')
        .attr('y1', '0')
        .attr('y2', '1');

    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#b41b20');
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#00ff00');

    var g = svg.append('g')
        .attr('transform', 'translate(25,60)');

    var meter = g.append('g')
        .attr('class', 'progress-meter');

    meter.append('path')
        .attr('class', 'background')
        .attr('fill', '#8d9aa3')
        .attr('fill-opacity', 0.6)
        .attr('d', powerArc.endAngle(powerTwoPi));

    powerFront = meter.append('path')
        .attr('class', 'foreground')
        .attr('fill', 'url(#gradient)')
        .attr('fill-opacity', 1);

    powerMeter = meter.append('text')
        .attr('fill', '#fff')
        .attr('text-anchor', 'middle')
        .attr('dy', '.35em')
        .attr('transform', 'rotate(180)');

};

function updatePower(progress) {
    powerFront.attr('d', powerArc.endAngle(powerTwoPi * progress));
    powerMeter.text(formatPercent(progress));
}

PowerMeter();