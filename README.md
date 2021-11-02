# sankey-plus

A JavaScript library for computing and drawing Sankey graphs.

Based on the [D3-Sankey](https://github.com/d3/d3-sankey) and D3-Sankey-Circular(https://github.com/tomshanley/d3-sankey-circular) libraries, and the experiments in my [Observable notebook](https://observablehq.com/@tomshanley/sankey-circular-deconstructed-part-2-manual-scaling/2).  

This library enhances those to provide:

* Handling for circular links
* Routing of long links to avoid overlapping nodes
* Improved layout
* Option to use d3.scaleLinear to size nodes and links, to ensure consistent scaling over different charts
* New API that uses a config object


## API Reference

Import *SankeyChart* from *sankeyPlus.js*:

```JavaScript
import { SankeyChart } from './sankeyPlus.js'
```

Create a new chart:

```JavaScript
let chart = new SankeyChart(element, config);
```

* **element**: An HTML element, such as a DIV, which will contain the SVG element created by SankeyChart.redraw()
* **config**: an options object containing the configuration for the sankey chart.

To render the chart, call the *redraw()* method, which creates an SVG element in the specified HTML element:

```JavaScript
chart.redraw();
```

## Config options:

The config options has the structure:

```JavaScript
let config = {
    //main options
    nodes: {
        //data and options for nodes
    },
    links: {
        //data and options for links
    },
    arrows: {
        //data and options for links
    }
}
```
### Main
| Option      | Description | Default       | Mandatory       |
| ----------- | ----------- |  ----------- | ----------- | 
| justify      | Title       | Left       |  No     |
| id   | If id is specified, sets the node id accessor to the specified function        | d => d.name      |   No    |
| iterations   | The number of relaxation iterations        | 32        | No        |
| extent   | Text        | [[0, 0,], [1, 1]]        |    No      |
| padding   | Padding around the chart, in pixels        | 20        | No        |
| width   | Width of the chart   | 1000        | No        |
| height   | Height of the chart        | 500        | No        |
| useManualScale   | TBC  True/False       | True        | No      |

### Nodes
| Option      | Description | Default       | Mandatory       |
| ----------- | ----------- |  ----------- | ----------- | 
| data      | An array of nodes objects, which must contain a property for the ID that is specified in the **id** option (the default is **name**).      | NA      |  Yes       |
| width   | Width of the node, in pixels        | 25        | No        |
| maxHeight   | If useManualScale is enabled, then the maximum height of the node for the scale's range        | 75        | No        |
| padding   | The ideal vertical space between each node          | 25        | No        |
| minPadding   | The minimum vertical space allowed between each node        | 25        | No        |
| virtualPadding   | The vertical space between nodes and any virtual links which are routed around nodes        | 7        | No        |
| sort   | A function that determines how nodes are ordered from left to right. This applies where there are circular links in the graph, so the 'first' nodes is arbitary. The sort will be overridden by the nodes order based on in incoming/outgoing links.        | null        | No        |
| setPositions   | If true, then the nodes' positions aren't optimised vertical.        | false        | No        |

### Links
| Option      | Description | Default       | Mandatory       |
| ---------- | ----------- |  ----------- | ----------- | 
| data      | An array of links objects, which must contain a **source**, **target** and **value** property. The source and target must refer to a node's ID.      | NA       |  Yes       |
| circularGap   | Text        | 5        | No         
| circularLinkPortionTopBottom   | The portion of the Height  that should be reserved for drawing circular links      | 0.4          | No        |
| circularLinkPortionLeftRight   | The portion of the Width that should be reserved for drawing circular links        |  0.1         | No        |
| useVirtualRoutes   | Text        | Text        | No        |
| virtualPadding   | Text        | Text        | No        |
| baseRadius   | Text        | Text        | No        |
| verticalMargin   | Text        | Text        | No        |
| opacity   | Opacity of the link stroke, from 0 to 1        | 1        | No        |
| virtualLinkType   | Text        | Text        | No        |

### Arrows
| Option      | Description | Default       | Mandatory       |
| ----------- | ----------- |  ----------- | ----------- | 
| enabled      | Select whether to show arrows. True/False       | false       |  No       |
| color   | Color of the arrow. Can use Hex code or CSS color name       | DarkSlateGrey        | No        |
| length   | Length of the arrow, in pixels        | 10        | No        |
| gap   | Length of the gap between each arrow, in pixels        | 25        | No        |
| headSize   | width of the arrow head, in pixels        | 4        | No        |