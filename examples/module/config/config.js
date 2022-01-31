export const config = {
  align: "left",
  id: (d) => d.name,
  iterations: 10,
  // extent: [
  //   [0, 0],
  //   [1, 1],
  // ],
  padding: 15,
  width: 500,
  height: 200,
  useManualScale: false,
  // showCanvasBorder: true,
  nodes: {
    data: [],
    width: 50,
    // scaleDomain: [0, 100],
    // scaleRange: [0, 500],
    padding: 20,
    minPadding: 20,
    virtualPadding: 7,
    horizontalSort: true, // true >> uses horizontalSort in nodes data for sorting
    verticalSort: true, // true >> uses verticalSort in nodes data for sorting
    setPositions: false,
  },
  links: {
    data: [],
    circularGap: 5,
    // circularLinkPortionTopBottom: 0.4,
    // circularLinkPortionLeftRight: 0.1,
    useVirtualRoutes: true,
    baseRadius: 8,
    verticalMargin: 15,
    opacity: 0.5,
    virtualLinkType: "both", // ["both", "bezier", "virtual"]
  },
  arrows: {
    enabled: true,
    color: "DarkSlateGrey",
    length: 10,
    gap: 25,
    headSize: 4,
  },
};


