import {
  selfLinking,
  onlyCircularLink
} from './linkAttributes.js';

import {
  sortLinkSourceYAscending,
  sortLinkSourceYDescending,
  sortLinkTargetYAscending,
  sortLinkTargetYDescending,
  sortLinkColumnAscending
} from './sortGraph.js';

export function addCircularPathData(inputGraph, id, circularLinkGap, baseRadius, verticalMargin) {
  //let graph = clone(inputGraph);
  let graph = inputGraph;
  //var baseRadius = 10
  var buffer = 5;
  //var verticalMargin = 25

  var minY = d3.min(graph.links, function (link) {
    return link.source.y0;
  });

  // create object for circular Path Data
  graph.links.forEach(function (link) {
    if (link.circular) {
      link.circularPathData = {};
    }
  });

  // calc vertical offsets per top/bottom links
  var topLinks = graph.links.filter(function (l) {
    return l.circularLinkType == 'top';
  });
    /* topLinks = */ calcVerticalBuffer(topLinks, id, circularLinkGap);

  var bottomLinks = graph.links.filter(function (l) {
    return l.circularLinkType == 'bottom';
  });
    /* bottomLinks = */ calcVerticalBuffer(bottomLinks, id, circularLinkGap);

  // add the base data for each link
  graph.links.forEach(function (link) {
    if (link.circular) {
      link.circularPathData.arcRadius = link.width + baseRadius;
      link.circularPathData.leftNodeBuffer = buffer;
      link.circularPathData.rightNodeBuffer = buffer;
      link.circularPathData.sourceWidth = link.source.x1 - link.source.x0;
      link.circularPathData.sourceX =
        link.source.x0 + link.circularPathData.sourceWidth;
      link.circularPathData.targetX = link.target.x0;
      link.circularPathData.sourceY = link.y0;
      link.circularPathData.targetY = link.y1;

      // for self linking paths, and that the only circular link in/out of that node
      if (selfLinking(link, id) && onlyCircularLink(link)) {
        link.circularPathData.leftSmallArcRadius = baseRadius + link.width / 2;
        link.circularPathData.leftLargeArcRadius = baseRadius + link.width / 2;
        link.circularPathData.rightSmallArcRadius = baseRadius + link.width / 2;
        link.circularPathData.rightLargeArcRadius = baseRadius + link.width / 2;

        if (link.circularLinkType == 'bottom') {
          link.circularPathData.verticalFullExtent =
            link.source.y1 +
            verticalMargin +
            link.circularPathData.verticalBuffer;
          link.circularPathData.verticalLeftInnerExtent =
            link.circularPathData.verticalFullExtent -
            link.circularPathData.leftLargeArcRadius;
          link.circularPathData.verticalRightInnerExtent =
            link.circularPathData.verticalFullExtent -
            link.circularPathData.rightLargeArcRadius;
        } else {
          // top links
          link.circularPathData.verticalFullExtent =
            link.source.y0 -
            verticalMargin -
            link.circularPathData.verticalBuffer;
          link.circularPathData.verticalLeftInnerExtent =
            link.circularPathData.verticalFullExtent +
            link.circularPathData.leftLargeArcRadius;
          link.circularPathData.verticalRightInnerExtent =
            link.circularPathData.verticalFullExtent +
            link.circularPathData.rightLargeArcRadius;
        }
      } else {
        // else calculate normally
        // add left extent coordinates, based on links with same source column and circularLink type
        var thisColumn = link.source.column;
        var thisCircularLinkType = link.circularLinkType;
        var sameColumnLinks = graph.links.filter(function (l) {
          return (
            l.source.column == thisColumn &&
            l.circularLinkType == thisCircularLinkType
          );
        });

        if (link.circularLinkType == 'bottom') {
          sameColumnLinks.sort(sortLinkSourceYDescending);
        } else {
          sameColumnLinks.sort(sortLinkSourceYAscending);
        }

        var radiusOffset = 0;
        sameColumnLinks.forEach(function (l, i) {
          if (l.circularLinkID == link.circularLinkID) {
            link.circularPathData.leftSmallArcRadius =
              baseRadius + link.width / 2 + radiusOffset;
            link.circularPathData.leftLargeArcRadius =
              baseRadius + link.width / 2 + i * circularLinkGap + radiusOffset;
          }
          radiusOffset = radiusOffset + l.width;
        });

        // add right extent coordinates, based on links with same target column and circularLink type
        thisColumn = link.target.column;
        sameColumnLinks = graph.links.filter(function (l) {
          return (
            l.target.column == thisColumn &&
            l.circularLinkType == thisCircularLinkType
          );
        });
        if (link.circularLinkType == 'bottom') {
          sameColumnLinks.sort(sortLinkTargetYDescending);
        } else {
          sameColumnLinks.sort(sortLinkTargetYAscending);
        }

        radiusOffset = 0;
        sameColumnLinks.forEach(function (l, i) {
          if (l.circularLinkID == link.circularLinkID) {
            link.circularPathData.rightSmallArcRadius =
              baseRadius + link.width / 2 + radiusOffset;
            link.circularPathData.rightLargeArcRadius =
              baseRadius + link.width / 2 + i * circularLinkGap + radiusOffset;
          }
          radiusOffset = radiusOffset + l.width;
        });

        // bottom links
        if (link.circularLinkType == 'bottom') {
          link.circularPathData.verticalFullExtent =
            Math.max(graph.y1, link.source.y1, link.target.y1) +
            verticalMargin +
            link.circularPathData.verticalBuffer;
          link.circularPathData.verticalLeftInnerExtent =
            link.circularPathData.verticalFullExtent -
            link.circularPathData.leftLargeArcRadius;
          link.circularPathData.verticalRightInnerExtent =
            link.circularPathData.verticalFullExtent -
            link.circularPathData.rightLargeArcRadius;
        } else {
          // top links
          link.circularPathData.verticalFullExtent =
            minY - verticalMargin - link.circularPathData.verticalBuffer;
          link.circularPathData.verticalLeftInnerExtent =
            link.circularPathData.verticalFullExtent +
            link.circularPathData.leftLargeArcRadius;
          link.circularPathData.verticalRightInnerExtent =
            link.circularPathData.verticalFullExtent +
            link.circularPathData.rightLargeArcRadius;
        }
      }

      // all links
      link.circularPathData.leftInnerExtent =
        link.circularPathData.sourceX + link.circularPathData.leftNodeBuffer;
      link.circularPathData.rightInnerExtent =
        link.circularPathData.targetX - link.circularPathData.rightNodeBuffer;
      link.circularPathData.leftFullExtent =
        link.circularPathData.sourceX +
        link.circularPathData.leftLargeArcRadius +
        link.circularPathData.leftNodeBuffer;
      link.circularPathData.rightFullExtent =
        link.circularPathData.targetX -
        link.circularPathData.rightLargeArcRadius -
        link.circularPathData.rightNodeBuffer;
    }

    if (link.circular) {
      link.path = createCircularPathString(link);
    } else {
      var normalPath = d3
        .linkHorizontal()
        .source(function (d) {
          var x = d.source.x0 + (d.source.x1 - d.source.x0);
          var y = d.y0;
          return [x, y];
        })
        .target(function (d) {
          var x = d.target.x0;
          var y = d.y1;
          return [x, y];
        });
      link.path = normalPath(link);
    }
  });

  return graph;
}



// creates vertical buffer values per set of top/bottom links
function calcVerticalBuffer(links, id, circularLinkGap) {
  links.sort(sortLinkColumnAscending);
  links.forEach(function (link, i) {
    var buffer = 0;

    if (selfLinking(link, id) && onlyCircularLink(link)) {
      link.circularPathData.verticalBuffer = buffer + link.width / 2;
    } else {
      var j = 0;
      for (j; j < i; j++) {
        if (circularLinksCross(links[i], links[j])) {
          var bufferOverThisLink =
            links[j].circularPathData.verticalBuffer +
            links[j].width / 2 +
            circularLinkGap;
          buffer = bufferOverThisLink > buffer ? bufferOverThisLink : buffer;
        }
      }

      link.circularPathData.verticalBuffer = buffer + link.width / 2;
    }
  });

  return links;
}

// Check if two circular links potentially overlap
function circularLinksCross(link1, link2) {
  if (link1.source.column < link2.target.column) {
    return false;
  } else if (link1.target.column > link2.source.column) {
    return false;
  } else {
    return true;
  }
}


// create a d path using the addCircularPathData
function createCircularPathString(link) {
  var pathString = '';
  // 'pathData' is assigned a value but never used
  // var pathData = {}

  if (link.circularLinkType == 'top') {
    pathString =
      // start at the right of the source node
      'M' +
      link.circularPathData.sourceX +
      ' ' +
      link.circularPathData.sourceY +
      ' ' +
      // line right to buffer point
      'L' +
      link.circularPathData.leftInnerExtent +
      ' ' +
      link.circularPathData.sourceY +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.leftLargeArcRadius +
      ' ' +
      link.circularPathData.leftSmallArcRadius +
      ' 0 0 0 ' +
      // End of arc X //End of arc Y
      link.circularPathData.leftFullExtent +
      ' ' +
      (link.circularPathData.sourceY -
        link.circularPathData.leftSmallArcRadius) +
      ' ' + // End of arc X
      // line up to buffer point
      'L' +
      link.circularPathData.leftFullExtent +
      ' ' +
      link.circularPathData.verticalLeftInnerExtent +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.leftLargeArcRadius +
      ' ' +
      link.circularPathData.leftLargeArcRadius +
      ' 0 0 0 ' +
      // End of arc X //End of arc Y
      link.circularPathData.leftInnerExtent +
      ' ' +
      link.circularPathData.verticalFullExtent +
      ' ' + // End of arc X
      // line left to buffer point
      'L' +
      link.circularPathData.rightInnerExtent +
      ' ' +
      link.circularPathData.verticalFullExtent +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.rightLargeArcRadius +
      ' ' +
      link.circularPathData.rightLargeArcRadius +
      ' 0 0 0 ' +
      // End of arc X //End of arc Y
      link.circularPathData.rightFullExtent +
      ' ' +
      link.circularPathData.verticalRightInnerExtent +
      ' ' + // End of arc X
      // line down
      'L' +
      link.circularPathData.rightFullExtent +
      ' ' +
      (link.circularPathData.targetY -
        link.circularPathData.rightSmallArcRadius) +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.rightLargeArcRadius +
      ' ' +
      link.circularPathData.rightSmallArcRadius +
      ' 0 0 0 ' +
      // End of arc X //End of arc Y
      link.circularPathData.rightInnerExtent +
      ' ' +
      link.circularPathData.targetY +
      ' ' + // End of arc X
      // line to end
      'L' +
      link.circularPathData.targetX +
      ' ' +
      link.circularPathData.targetY;
  } else {
    // bottom path
    pathString =
      // start at the right of the source node
      'M' +
      link.circularPathData.sourceX +
      ' ' +
      link.circularPathData.sourceY +
      ' ' +
      // line right to buffer point
      'L' +
      link.circularPathData.leftInnerExtent +
      ' ' +
      link.circularPathData.sourceY +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.leftLargeArcRadius +
      ' ' +
      link.circularPathData.leftSmallArcRadius +
      ' 0 0 1 ' +
      // End of arc X //End of arc Y
      link.circularPathData.leftFullExtent +
      ' ' +
      (link.circularPathData.sourceY +
        link.circularPathData.leftSmallArcRadius) +
      ' ' + // End of arc X
      // line down to buffer point
      'L' +
      link.circularPathData.leftFullExtent +
      ' ' +
      link.circularPathData.verticalLeftInnerExtent +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.leftLargeArcRadius +
      ' ' +
      link.circularPathData.leftLargeArcRadius +
      ' 0 0 1 ' +
      // End of arc X //End of arc Y
      link.circularPathData.leftInnerExtent +
      ' ' +
      link.circularPathData.verticalFullExtent +
      ' ' + // End of arc X
      // line left to buffer point
      'L' +
      link.circularPathData.rightInnerExtent +
      ' ' +
      link.circularPathData.verticalFullExtent +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.rightLargeArcRadius +
      ' ' +
      link.circularPathData.rightLargeArcRadius +
      ' 0 0 1 ' +
      // End of arc X //End of arc Y
      link.circularPathData.rightFullExtent +
      ' ' +
      link.circularPathData.verticalRightInnerExtent +
      ' ' + // End of arc X
      // line up
      'L' +
      link.circularPathData.rightFullExtent +
      ' ' +
      (link.circularPathData.targetY +
        link.circularPathData.rightSmallArcRadius) +
      ' ' +
      // Arc around: Centre of arc X and  //Centre of arc Y
      'A' +
      link.circularPathData.rightLargeArcRadius +
      ' ' +
      link.circularPathData.rightSmallArcRadius +
      ' 0 0 1 ' +
      // End of arc X //End of arc Y
      link.circularPathData.rightInnerExtent +
      ' ' +
      link.circularPathData.targetY +
      ' ' + // End of arc X
      // line to end
      'L' +
      link.circularPathData.targetX +
      ' ' +
      link.circularPathData.targetY;
  }

  return pathString;
}