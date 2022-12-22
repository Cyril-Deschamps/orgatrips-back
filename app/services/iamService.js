export function giveGlobalAccess(req, objectName, right) {
  if (!req.iam) {
    req.iam = { [objectName]: { global: right } };
  } else if (!req.iam[objectName]) {
    req.iam[objectName] = { global: right };
  } else {
    req.iam[objectName].global = (req.iam[objectName].global || 0) | right;
  }
}

export function hasGlobalAccess(req, objectName, right) {
  return (
    req.iam &&
    req.iam[objectName] &&
    req.iam[objectName].global !== undefined &&
    (req.iam[objectName].global & right) > 0
  );
}

export function giveSpecificAccess(req, objectName, right, param) {
  const tuplesToPush = Array.isArray(param)
    ? param.map((p) => [right, p])
    : [[right, param]];

  if (!req.iam) {
    req.iam = { [objectName]: { specific: tuplesToPush } };
  } else if (!req.iam[objectName]) {
    req.iam[objectName] = { specific: tuplesToPush };
  } else if (!req.iam[objectName].specific) {
    req.iam[objectName].specific = tuplesToPush;
  } else {
    req.iam[objectName].specific.push(...tuplesToPush);
  }
}

export function getSpecificAccesses(req, objectName, right) {
  if (!req.iam || !req.iam[objectName] || !req.iam[objectName].specific)
    return [];
  return req.iam[objectName].specific
    .filter((t) => (t[0] & right) > 0)
    .map((t) => t[1]);
}

export function iamGenerator() {
  let index = 0;
  return () => {
    const newBit = 1 << index;
    index++;
    return newBit;
  };
}
