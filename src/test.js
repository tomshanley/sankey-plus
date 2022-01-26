// calculate the optimum path for a link to reduce overlaps
function addCircularPathData(inputGraph) {
    let graph = clone(inputGraph);
  
    //var baseRadius = 10
    var buffer = 5;
    //var verticalMargin = 25
  
    var minY = d3.min(graph.links, function(link) {
      return link.source.y0;
    });
  
    // create object for circular Path Data
    graph.links.forEach(function(link) {
      if (link.circular) {
        link.circularPathData = {};
      }
    });
  
    // calc vertical offsets per top/bottom links
    var topLinks = graph.links.filter(function(l) {
      return l.circularLinkType == 'top';
    });
    /* topLinks = */ calcVerticalBuffer(topLinks);
  
    var bottomLinks = graph.links.filter(function(l) {
      return l.circularLinkType == 'bottom';
    });
    /* bottomLinks = */ calcVerticalBuffer(bottomLinks);
  
    // add the base data for each link
    graph.links.forEach(function(link) {
      if (link.circular) {
        link.circularPathData.arcRadius = link.width + baseRadius;
        link.circularPathData.rightNodeBuffer = buffer;
        link.circularPathData.leftNodeBuffer = buffer;
        link.circularPathData.sourceWidth = link.source.x1 - link.source.x0;
        link.circularPathData.sourceX =
          link.source.x0 + link.circularPathData.sourceWidth;
        link.circularPathData.targetX = link.target.x0;
        link.circularPathData.sourceY = link.y0;
        link.circularPathData.targetY = link.y1;
  
        // for self linking paths, and that the only circular link in/out of that node
        if (selfLinking(link, id) && onlyCircularLink(link)) {
          link.circularPathData.rightSmallArcRadius = baseRadius + link.width / 2;
          link.circularPathData.rightLargeArcRadius = baseRadius + link.width / 2;
          link.circularPathData.leftSmallArcRadius = baseRadius + link.width / 2;
          link.circularPathData.leftLargeArcRadius = baseRadius + link.width / 2;
  
          if (link.circularLinkType == 'bottom') {
            link.circularPathData.verticalFullExtent =
              link.source.y1 +
              verticalMargin +
              link.circularPathData.verticalBuffer;
            link.circularPathData.verticalRightInnerExtent =
              link.circularPathData.verticalFullExtent -
              link.circularPathData.rightLargeArcRadius;
            link.circularPathData.verticalLeftInnerExtent =
              link.circularPathData.verticalFullExtent -
              link.circularPathData.leftLargeArcRadius;
          } else {
            // top links
            link.circularPathData.verticalFullExtent =
              link.source.y0 -
              verticalMargin -
              link.circularPathData.verticalBuffer;
            link.circularPathData.verticalRightInnerExtent =
              link.circularPathData.verticalFullExtent +
              link.circularPathData.rightLargeArcRadius;
            link.circularPathData.verticalLeftInnerExtent =
              link.circularPathData.verticalFullExtent +
              link.circularPathData.leftLargeArcRadius;
          }
        } else {
          // else calculate normally
          // add right extent coordinates, based on links with same source column and circularLink type
          var thisColumn = link.source.column;
          var thisCircularLinkType = link.circularLinkType;
          var sameColumnLinks = graph.links.filter(function(l) {
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
          sameColumnLinks.forEach(function(l, i) {
            if (l.circularLinkID == link.circularLinkID) {
              link.circularPathData.rightSmallArcRadius =
                baseRadius + link.width / 2 + radiusOffset;
              link.circularPathData.rightLargeArcRadius =
                baseRadius + link.width / 2 + i * circularLinkGap + radiusOffset;
            }
            radiusOffset = radiusOffset + l.width;
          });
  
          // add left extent coordinates, based on links with same target column and circularLink type
          thisColumn = link.target.column;
          sameColumnLinks = graph.links.filter(function(l) {
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
          sameColumnLinks.forEach(function(l, i) {
            if (l.circularLinkID == link.circularLinkID) {
              link.circularPathData.leftSmallArcRadius =
                baseRadius + link.width / 2 + radiusOffset;
              link.circularPathData.leftLargeArcRadius =
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
            link.circularPathData.verticalRightInnerExtent =
              link.circularPathData.verticalFullExtent -
              link.circularPathData.rightLargeArcRadius;
            link.circularPathData.verticalLeftInnerExtent =
              link.circularPathData.verticalFullExtent -
              link.circularPathData.leftLargeArcRadius;
          } else {
            // top links
            link.circularPathData.verticalFullExtent =
              minY - verticalMargin - link.circularPathData.verticalBuffer;
            link.circularPathData.verticalRightInnerExtent =
              link.circularPathData.verticalFullExtent +
              link.circularPathData.rightLargeArcRadius;
            link.circularPathData.verticalLeftInnerExtent =
              link.circularPathData.verticalFullExtent +
              link.circularPathData.leftLargeArcRadius;
          }
        }
  
        // all links
        link.circularPathData.rightInnerExtent =
          link.circularPathData.sourceX + link.circularPathData.rightNodeBuffer;
        link.circularPathData.leftInnerExtent =
          link.circularPathData.targetX - link.circularPathData.leftNodeBuffer;
        link.circularPathData.rightFullExtent =
          link.circularPathData.sourceX +
          link.circularPathData.rightLargeArcRadius +
          link.circularPathData.rightNodeBuffer;
        link.circularPathData.leftFullExtent =
          link.circularPathData.targetX -
          link.circularPathData.leftLargeArcRadius -
          link.circularPathData.leftNodeBuffer;
      }
  
      if (link.circular) {
        link.path = createCircularPathString(link);
      } else {
        var normalPath = d3
          .linkHorizontal()
          .source(function(d) {
            var x = d.source.x0 + (d.source.x1 - d.source.x0);
            var y = d.y0;
            return [x, y];
          })
          .target(function(d) {
            var x = d.target.x0;
            var y = d.y1;
            return [x, y];
          });
        link.path = normalPath(link);
      }
    });
  
    return graph;
  }