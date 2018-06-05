var radius = 110;
var border = 5;
var padding = 10;
var progress = 0;
var prevProgress = 0;

var twoPi = Math.PI * 1.5;
var formatPercent = d3.format('.0%');
var boxSize = (radius + padding) * 2;

var arc = d3.svg.arc()
    .startAngle(0)
    .innerRadius(radius)
    .outerRadius(radius - border - 10);

var parent = d3.select('.speed-meter');

var svg = parent.append('svg')
    .attr('width', boxSize)
    .attr('height', boxSize);

var defs = svg.append('defs');

var gradient = defs.append('linearGradient')
    .attr('id', 'gradient')
    .attr('x1', '0')
    .attr('x2','0')
    .attr('y1','0')
    .attr('y2', '1');

gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#205893');
gradient.append('stop')
    .attr('offset','100%')
    .attr('stop-color', '#50b7f9');

var negGradient = defs.append('linearGradient')
    .attr('id', 'gradient2')
    .attr('x1', '0')
    .attr('x2','0')
    .attr('y1','0')
    .attr('y2', '1');

negGradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', '#50b7f9');
negGradient.append('stop')
    .attr('offset','100%')
    .attr('stop-color', '#205893');

var g = svg.append('g')
    .attr('transform', 'translate(' + boxSize / 2 + ',' + boxSize / 2 + ')');

var meter = g.append('g')
    .attr('class', 'progress-meter');

meter.append('path')
    .attr('class', 'background')
    .attr('fill', '#ccc')
    .attr('fill-opacity', 0.1)
    .attr('stroke','#8ac4ec')
    .attr('d', arc.endAngle(twoPi));

var front = meter.append('path')
    .attr('class', 'foreground')
    .attr('fill', 'url(#gradient)')
    .attr('fill-opacity', 1);

var numberText = meter.append('text')
    .attr('fill', '#fff')
    .attr('text-anchor', 'middle')
    .attr('dy', '.35em')
    .attr('transform','rotate(180)');

function updateProgress(progress) {
    if (progress < 0) {
        front.attr('d', arc.endAngle(twoPi * Math.abs(progress)));
        if(prevProgress > 0) {
            front.attr('fill', 'url(#gradient2)');
        }
    } else {
        front.attr('d', arc.endAngle(twoPi * progress));
        if(prevProgress < 0) {
            front.attr('fill', 'url(#gradient)');
        }
    }

    numberText.text(formatPercent(progress));
    prevProgress = progress;
}
updateProgress(0);