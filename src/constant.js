// returns a function, using the parameter given to the sankey setting
export function constant(x) {
    return function() {
      return x;
    };
  }