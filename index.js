


//////////////////////////////////////////////////////////////////////
////////////////////////////RAYCASTER/////////////////////////////////
//////////////////////////////2020////////////////////////////////////
//////////////////////////////////////////////////////////////////////
////////////////////////////by OlegOsh////////////////////////////////
//////////////////////////////////////////////////////////////////////
////////////////////////////resources:////////////////////////////////
///////////////////////////permadi.com////////////////////////////////
/////////////////Lode's Computer Graphics Tutorial////////////////////
//////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////
///////////////////////variables, constants///////////////////////////
//////////////////////////////////////////////////////////////////////

const PI = Math.PI;
const fullCircleDeg = 360;
const halfCircleDeg = fullCircleDeg / 2;
const fullCircleRad = PI * 2;
// const savingFromDividingByZeroValue = 1E-4;
const safeMaxIntegerValue = Number.MAX_SAFE_INTEGER;

// const sinTable = [];
// const cosTable = [];
// const tanTable = [];

// for (let i = 0; i < fullCircleDeg; i += 1) {
//   sinTable[i] = sin(i, true);
//   cosTable[i] = cos(i, true);
//   tanTable[i] = tan(i, true);
// }
// sinTable[fullCircleDeg] = sinTable[0];
// cosTable[fullCircleDeg] = cosTable[0];
// tanTable[fullCircleDeg] = tanTable[0];

const map = [
  '111311131111811',
  '100010000000001',
  '100000000211001',
  '400000000070001',
  '400000000000008',
  '500450000000301',
  '400100000011801',
  '406610001000405',
  '100000001162404',
  '200000000000004',
  '187744711118111'
];

const wallSize = 64;
const wallColor = '#E9901C';
const wallStrokeColor = '#282828';

const playerHeight = wallSize / 2;
const playerFOV = 60;//deg
const playerStartingPosition = { x: 96, y: 160 };//grid 1,2
const playerAngle = 45;//deg
const playerRadius = wallSize / 2;
const playerColor = 'rgba(70, 120, 40, 0.3)'//'#09600F';
const playerMoveSpeed = 3;
const playerTurnSpeed = 2;//deg
const playerDirectionLineWidth = 4;
const rayDirectionLineWidth = playerDirectionLineWidth / 4;

const playerDirectionLineMultiplier = 2;
const rayDirectionLineMultiplier = playerDirectionLineMultiplier * 2;

const logFontSize = 12;
const logFont = 'monospace';
const logFontColor = '#102C03';

const playerDirectionLineColor = 'rgba(70, 50, 40, 0.1)'//'#91960C';
const rayDirectionLineColor = 'rgba(100, 150, 15, 0.1)'//'#81b61C';
const rayDirectionHelperLineColor = '#128932';
const helpingStrokeRectColor = '#1f4b3a';
const horizontalRayColor = '#f43112';
const verticalRayColor = '#3112f4';
const closestRayColor = '#31f412';
const rayLineWeight = 1;

const wallSliceWidth = 1;
const wallSliceColor = '#fafafa';

const skyColor = '#00FFBF';
const floorColor = '#6B3D06';

const pointSize = 2;
const pointColor = '#b44331';

const projectionPlaneWidth = 320;
const projectionPlaneHeight = 200;

const mapWidth = wallSize * map[0].length;
const mapHeight = wallSize * map.length;

const viewElement = document.getElementById('view');
const viewElementWidth = viewElement.width = projectionPlaneWidth;
const viewElementHeight = viewElement.height = projectionPlaneHeight;
const viewContext = viewElement.getContext('2d');
const mapElement = document.getElementById('map');
const mapElementWidth = mapElement.width = wallSize * map[0].length;
const mapElementHeight = mapElement.height = wallSize * map.length;
const mapContext = mapElement.getContext('2d');

const halfOfProjectionPlaneWidth = projectionPlaneWidth / 2;
const halfOfProjectionPlaneHeight = projectionPlaneHeight / 2;
const halfOfPlayerFOV = playerFOV / 2;

const tanOfHalfOfPlayerFOVRad = Math.tan(degreesToRadians(halfOfPlayerFOV));
const distanceFromPlayerToProjectionPlane = halfOfProjectionPlaneWidth / tanOfHalfOfPlayerFOVRad;
// console.log(distanceFromPlayerToProjectionPlane);//277.1281292110204 px
const angleBetweenSubsequentRays = playerFOV / projectionPlaneWidth;//deg
// console.log(angleBetweenSubsequentRays);//0.1875 deg

const textures = [];
const shadowedTextures = [];
const texturesSrc = [
  'img/greystone.png',//1
  'img/mossy.png',//2
  'img/colorstone.png',//3
  'img/redbrick.png',//4
  'img/eagle.png',//5
  'img/wood.png',//6
  'img/purplestone.png',//7
  'img/bluestone.png'//8
];

//////////////////////////////////////////////////////////////////////
///////////////////////////functions//////////////////////////////////
//////////////////////////////////////////////////////////////////////

function randomInteger(min, max) {
  return Math.floor(Math.random() * (1 + max - min) + min);
}

function randomColorHex() {
  let colorString = '#';
  const colorNumbers = [];
  for(let i = 0; i < 6; i += 1) {
    colorNumbers[i] = randomInteger(0, 15);
  }
  const colorValues = colorNumbers.map(number => {
    return number.toString(16);
  });
  return colorString + colorValues.join('');
}

function degreesToRadians(deg) {
  return deg * PI / halfCircleDeg;
}

function radiansToDegrees(rad) {
  return rad * halfCircleDeg / PI;
}

// function transformAngle(deg, safe) {//:rad
//   let newAngle = degreesToRadians(deg);
//   if (safe) {
//     newAngle += savingFromDividingByZeroValue;
//   }
//   return newAngle;
// }

// function tan(angle, safe) {//:rad
//   let angleRad = transformAngle(angle, safe);
//   return Math.tan(angleRad);
// }

// function sin(angle, safe) {//:rad
//   let angleRad = transformAngle(angle, safe);
//   return Math.sin(angleRad);
// }

// function cos(angle, safe) {//:rad
//   let angleRad = transformAngle(angle, safe);
//   return Math.cos(angleRad);
// }

function floor(num) {
  return Math.floor(num);
}

function round(num) {
  return Math.round(num);
}

function abs(num) {
  return Math.abs(num);
}

function normalizeAngle(angle) {
  angle %= fullCircleRad;
  if(angle < 0) {
    angle += fullCircleRad;
  }
  return angle;
}

function findDistance(x1, y1, x2, y2) {
  return Math.sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2));
}

function drawFillRect(x, y, width, height, color, context) {
  context.save();
  context.fillStyle = color;
  context.fillRect(x, y, width, height);
  context.restore();
}

function drawStrokeRect(x, y, width, height, color, context) {
  context.save();
  context.strokeStyle = color;
  context.strokeRect(x, y, width, height);
  context.restore();
}

function drawFillCircle(x, y, radius, color, context) {
  context.save();
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, fullCircleRad, true);
  context.fill();
  context.restore();
}

function drawLine(x1, y1, x2, y2, width, color, context) {
  context.save();
  context.lineWidth = width;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.closePath();
  context.stroke();
  context.restore();
}

function drawFillText(text, x, y, size, font, color, context) {
  context.save();
  context.font = size + 'px ' + font;
  context.textBaseline = 'top';
  context.fillStyle = color;
  context.fillText(text, x, y);
  context.restore();
}

function log(text, x, y, context) {
  drawFillText(
    text,
    x,
    y,
    logFontSize,
    logFont,
    logFontColor,
    context ? mapContext : viewContext
  );
}

function clearCanvas(width, height, context) {
  context.clearRect(0, 0, width, height);
}

function drawMap() {
  for(let y = 0; y < map.length; y += 1) {
    for(let x = 0; x < map[0].length; x += 1) {
      if(map[y][x] !== '0') {
        drawFillRect(x * wallSize, y * wallSize, wallSize, wallSize, wallColor, mapContext);
      }
      // drawStrokeRect(x * wallSize, y * wallSize, wallSize, wallSize, wallStrokeColor, mapContext)
      // log(`${x}, ${y}`, x * wallSize + 2, y * wallSize + 2, viewContext);
    }
  }
}

//////////////////////////////////////////////////////////////////////
//////////////////////////////classes/////////////////////////////////
//////////////////////////////////////////////////////////////////////

class Player {
  constructor(x, y, radius, color, context) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.context = context;

    this.angle = degreesToRadians(playerAngle);
    this.moveSpeed = playerMoveSpeed;
    this.turnSpeed = degreesToRadians(playerTurnSpeed);
    this.moveDirection = 0;
    this.turnDirection = 0;
  }

  draw() {
    drawFillCircle(this.x, this.y, this.radius, this.color, this.context);
    drawLine(
      this.x,
      this.y,
      this.x + this.radius * Math.cos(this.angle),
      this.y + this.radius * Math.sin(this.angle),
      playerDirectionLineWidth,
      playerDirectionLineColor,
      mapContext
    );
    //FOV
    drawLine(
      this.x,
      this.y,
      this.x + this.radius * playerDirectionLineMultiplier * Math.cos(this.angle - degreesToRadians(halfOfPlayerFOV)),
      this.y + this.radius * playerDirectionLineMultiplier * Math.sin(this.angle - degreesToRadians(halfOfPlayerFOV)),
      playerDirectionLineWidth / 2,
      playerDirectionLineColor,
      mapContext
    );
    drawLine(
      this.x,
      this.y,
      this.x + this.radius * playerDirectionLineMultiplier * Math.cos(this.angle + degreesToRadians(halfOfPlayerFOV)),
      this.y + this.radius * playerDirectionLineMultiplier * Math.sin(this.angle + degreesToRadians(halfOfPlayerFOV)),
      playerDirectionLineWidth / 2,
      playerDirectionLineColor,
      mapContext
    );
  }

  isWallCollision(x, y) {
    var gridY = floor(y / wallSize);
    var gridX = floor(x / wallSize);
    return (
      (
        x < 0 || x >= map[0].length * wallSize ||
        y < 0 || y >= map.length * wallSize
      ) ||
      (
        map[gridY][gridX] !== '0'
      )
    );
  }

  move() {
    //
    this.angle = normalizeAngle(this.angle);

    this.angle = this.angle + (this.turnSpeed * this.turnDirection);
    const newX = this.x + (this.moveSpeed * this.moveDirection) * Math.cos(this.angle);
    const newY = this.y + (this.moveSpeed * this.moveDirection) * Math.sin(this.angle);
    //
    if (this.isWallCollision(newX, newY)) {
      return;
    }
    //
    this.x = newX;
    this.y = newY;
  }

  rayFacing(angle) {
    let facing = {
      vertical: null,
      horizontal: null
    };

    angle = radiansToDegrees(angle);

    if (angle > 0 && angle <= 180) {
      facing.vertical = 'down';
    } else if (angle > 180 && angle <= 360) {
      facing.vertical = 'up';
    }

    if (
        (angle > 270 && angle <= 360) ||
        (angle > 0 && angle <= 90)
      ) {
      facing.horizontal = 'right';
    } else if (angle > 90 && angle <= 270) {
      facing.horizontal = 'left';
    }

    return facing;
  }

  switchGridTile(tile, intersection, length) {
    switch (tile) {
      case '1':
        return {...intersection, length, type: '1'};
    
      case '2':
        return {...intersection, length, type: '2'};

      case '3':
        return {...intersection, length, type: '3'};

      case '4':
        return {...intersection, length, type: '4'};

      case '5':
        return {...intersection, length, type: '5'};

      case '6':
        return {...intersection, length, type: '6'};

      case '7':
        return {...intersection, length, type: '7'};

      case '8':
        return {...intersection, length, type: '8'};
    }
  }

  findHorizontalIntersection(rayAngle, facing) {
    const intersection = {
      length: 0,
      type: '1',
      offset: 0
    };
    let horizontalDistance = 0;
    let horizontalIntersectionRayLength = 0;
    let gridX = 0;
    let gridY = 0;

    let pointX = 0;
    let pointY = 0;

    const angleDeg = round(radiansToDegrees(rayAngle));
    if (angleDeg === 180 || angleDeg === 360) {
      return {...intersection, length: safeMaxIntegerValue};
    }

    //find first intersection point
    if (facing.vertical === 'up') {
      pointY = floor(this.y / wallSize) * wallSize - 1;
    } else if (facing.vertical === 'down') {
      pointY = floor(this.y / wallSize) * wallSize + wallSize;
    }
    pointX = this.x + (pointY - this.y) / Math.tan(rayAngle);

    // drawLine(
    //   this.x,
    //   this.y,
    //   pointX,
    //   pointY,
    //   rayLineWeight,
    //   horizontalRayColor,
    //   mapContext
    // );

    //grid position
    gridX = floor(pointX / wallSize);
    gridY = floor(pointY / wallSize);

    //update length
    // horizontalIntersectionRayLength += abs((pointX - this.x) / cosTable[angleDeg]);
    // if (angleDeg === 90 || angleDeg === 270) {
    //   horizontalIntersectionRayLength += abs((pointY - this.y) / sinTable[angleDeg]);
    // } else {
    //   horizontalIntersectionRayLength += abs((pointX - this.x) / cosTable[angleDeg]);
    // }
    horizontalIntersectionRayLength = findDistance(this.x, this.y, pointX, pointY);
    // log(`length = ${horizontalIntersectionRayLength}, ${horizontalDistance}`, 10, 100);

    intersection.offset = floor(pointX % wallSize);
    intersection.type = map[gridY][gridX];

    //exit condition
    if (gridY >= map.length || gridY < 0 || gridX >= map[0].length || gridX < 0) {
      // console.log('out');
      return {...intersection, length: horizontalIntersectionRayLength};
    }
    // if (map[gridY][gridX] === '1') {
    //   // console.log('grid "1"');
    //   return {...intersection, length: horizontalIntersectionRayLength, type: '1'};
    // }
    if (map[gridY][gridX] !== '0') {
      return this.switchGridTile(map[gridY][gridX], intersection, horizontalIntersectionRayLength);
    }

    //find Ya, Xa
    let Ya = 0;
    let Xa = 0;
    let newPointX = 0;
    let newPointY = 0;

    if (facing.vertical === 'up') {
      Ya = -wallSize;
    } else if (facing.vertical === 'down') {
      Ya = wallSize;
    }
    Xa = wallSize / Math.tan(rayAngle);//tanTable[angleDeg];
    if ((facing.horizontal === 'left' && Xa > 0) || (facing.horizontal === 'right' && Xa < 0)) {
      Xa = -wallSize / Math.tan(rayAngle);//tanTable[angleDeg];
    }

    //loop
    let y = 0;
    do {
      y += 10;
      //find next point
      newPointX = pointX + Xa;
      newPointY = pointY + Ya;
      //draw line
      // drawLine(
      //   pointX,
      //   pointY,
      //   newPointX,
      //   newPointY,
      //   rayLineWeight,
      //   horizontalRayColor,
      //   mapContext
      // );
      //update length
      // horizontalIntersectionRayLength += abs((newPointX - pointX) / cosTable[angleDeg]);
      // log(`length = ${horizontalIntersectionRayLength}`, 10, 100 + y);
      //check grid
      gridY = floor(newPointY / wallSize);
      gridX = floor(newPointX / wallSize);
      //update point
      pointX = newPointX;
      pointY = newPointY;
      //exit condition
      if (gridY >= map.length || gridY < 0 || gridX >= map[0].length || gridX < 0) {
        // console.log('exit');
        break;
      }
      //another exit condition
      if (newPointX <= 0 || newPointX >= mapWidth || newPointY <= 0 || newPointY >= mapHeight) {
        // console.log('exit "out"');
        break;
      }
    } while (map[gridY][gridX] === '0');
    //update length
    horizontalIntersectionRayLength = findDistance(this.x, this.y, pointX, pointY);
    // log(`length = ${horizontalIntersectionRayLength}, ${horizontalDistance}`, 10, 150);

    intersection.offset = floor(pointX % wallSize);
    intersection.type = map[gridY][gridX];

    return {...intersection, length: horizontalIntersectionRayLength};
  }

  findVerticalIntersection(rayAngle, facing) {
    const intersection = {
      length: 0,
      type: '1',
      offset: 0
    };
    let verticalIntersectionRayLength = 0;
    let gridX = 0;
    let gridY = 0;

    let pointX = 0;
    let pointY = 0;

    const angleDeg = round(radiansToDegrees(rayAngle));
    if (angleDeg === 90 || angleDeg === 270) {
      return {...intersection, length: safeMaxIntegerValue};
    }

    //find first intersection point
    if (facing.horizontal === 'right') {
      pointX = floor(this.x / wallSize) * wallSize + wallSize;
    } else if (facing.horizontal === 'left') {
      pointX = floor(this.x / wallSize) * wallSize - 1;
    }
    pointY = this.y + (pointX - this.x) * Math.tan(rayAngle);

    // drawLine(
    //   this.x,
    //   this.y,
    //   pointX,
    //   pointY,
    //   rayLineWeight,
    //   verticalRayColor,
    //   mapContext
    // );

    //grid position
    gridX = floor(pointX / wallSize);
    gridY = floor(pointY / wallSize);

    verticalIntersectionRayLength = findDistance(this.x, this.y, pointX, pointY);

    intersection.offset = floor(pointY % wallSize);
    if (gridY >= map.length || gridY < 0 || gridX >= map[0].length || gridX < 0) {
      intersection.type = '1';
    } else {
      intersection.type = map[gridY][gridX];
    }

    //exit condition
    if (gridY >= map.length || gridY < 0 || gridX >= map[0].length || gridX < 0) {
      // console.log('out');
      return {...intersection, length: verticalIntersectionRayLength};
    }
    // if (map[gridY][gridX] === '1') {
    //   // console.log('grid "1"');
    //   return {...intersection, length: verticalIntersectionRayLength, type: '1'};
    // }
    if (map[gridY][gridX] !== '0') {
      return this.switchGridTile(map[gridY][gridX], intersection, verticalIntersectionRayLength);
    }

    //find Xa, Ya
    let Xa = 0;
    let Ya = 0;
    let newPointX = 0;
    let newPointY = 0;

    if (facing.horizontal === 'right') {
      Xa = wallSize;
    } else if (facing.horizontal === 'left') {
      Xa = -wallSize;
    }
    Ya = wallSize * Math.tan(rayAngle);//tanTable[angleDeg];
    if ((facing.vertical === 'up' && Ya > 0) || (facing.vertical === 'down' && Ya < 0)) {
      Ya = -wallSize * Math.tan(rayAngle);//tanTable[angleDeg];
    }

    //loop
    do {
      //find next point
      newPointX = pointX + Xa;
      newPointY = pointY + Ya;
      //draw line
      // drawLine(
      //   pointX,
      //   pointY,
      //   newPointX,
      //   newPointY,
      //   rayLineWeight,
      //   verticalRayColor,
      //   mapContext
      // );
      //check grid
      gridY = floor(newPointY / wallSize);
      gridX = floor(newPointX / wallSize);
      //update point
      pointX = newPointX;
      pointY = newPointY;
      //exit condition
      if (gridY >= map.length || gridY < 0 || gridX >= map[0].length || gridX < 0) {
        break;
      }
      //another exit condition
      if (newPointX <= 0 || newPointX >= mapWidth || newPointY <= 0 || newPointY >= mapHeight) {
        break;
      }
    } while (map[gridY][gridX] === '0');
    //update length
    verticalIntersectionRayLength = findDistance(this.x, this.y, pointX, pointY);

    intersection.offset = floor(pointY % wallSize);
    if (gridY >= map.length || gridY < 0 || gridX >= map[0].length || gridX < 0) {
      intersection.type = '1';
    } else {
      intersection.type = map[gridY][gridX];
    }

    return {...intersection, length: verticalIntersectionRayLength};
  }

/*
1. Based on the viewing angle, subtract half of the player FOV.
2. Starting from column 0:
  a. Cast a ray. (The ray is just an "imaginary" line extending from the player.)
  b. Trace the ray until it hits a wall.
3. Record the distance to the wall (the distance is equal to the length of the ray).
4. Add the angle increment so that the ray moves to the right.
5. Repeat step 2 and 3 for each subsequent column until all rays are cast.
*/

  //cast a single ray
  castRay(rayAngle, column) {
    const intersection = {};
    let rayLength = 0;

    rayAngle = normalizeAngle(rayAngle);

    let facing = this.rayFacing(rayAngle);

    /////////////////////////
    //horizontal intersection

    const horizontalIntersection = this.findHorizontalIntersection(rayAngle, facing);
    const horizontalIntersectionRayLength = horizontalIntersection.length;

    // log(`ray angle = ${round(radiansToDegrees(rayAngle))}`, 10, 20);
    // log(`horizontal ray length = ${horizontalIntersectionRayLength}`, 10, 30);

    ///////////////////////
    //vertical intersection

    const verticalIntersection = this.findVerticalIntersection(rayAngle, facing);
    const verticalIntersectionRayLength = verticalIntersection.length;

    // log(`ray angle = ${round(radiansToDegrees(rayAngle))}`, 10, 120);
    // log(`vertical ray length = ${verticalIntersectionRayLength}`, 10, 130);

    //find ray length = closest intersection ray length
    // rayLength = (horizontalIntersectionRayLength < verticalIntersectionRayLength)
      // ? horizontalIntersectionRayLength
      // : verticalIntersectionRayLength;
    if (horizontalIntersectionRayLength < verticalIntersectionRayLength) {
      rayLength = horizontalIntersectionRayLength;
      intersection.type = horizontalIntersection.type;
      intersection.offset = horizontalIntersection.offset;
      intersection.side = 'horizontal';
    } else {
      rayLength = verticalIntersectionRayLength;
      intersection.type = verticalIntersection.type;
      intersection.offset = verticalIntersection.offset;
      intersection.side = 'vertical';
    }

    // console.log(intersection);
    // debugger;

    //line
    drawLine(
      this.x,
      this.y,
      this.x + rayLength * Math.cos(rayAngle),
      this.y + rayLength * Math.sin(rayAngle),
      rayLineWeight,
      closestRayColor,
      mapContext
    );

    //correction of fish-eye distortion
    const correctedDistance = rayLength * Math.cos(rayAngle - this.angle);

    //calculate wall slice height
    const wallSliceHeight = (wallSize / correctedDistance) * distanceFromPlayerToProjectionPlane;

    //draw wall slice
    // drawFillRect(
    //   column,
    //   halfOfProjectionPlaneHeight - wallSliceHeight / 2,
    //   wallSliceWidth,
    //   wallSliceHeight,
    //   wallSliceColor,
    //   viewContext
    // );

    //
    let textureArrayLink;
    if (intersection.side === 'horizontal') {
      textureArrayLink = textures;
    } else {
      textureArrayLink = shadowedTextures;
    }

    //draw texture slice
    viewContext.drawImage(
      textureArrayLink[Number(intersection.type) - 1],//img
      floor(intersection.offset),//sx
      0,//sy
      1,//sw
      textureArrayLink[Number(intersection.type) - 1].height,//sh
      column,//dx
      halfOfProjectionPlaneHeight - wallSliceHeight / 2,//dy
      wallSliceWidth,//dw
      wallSliceHeight//dh
    );
  }

  //cast all the rays
  castRays() {
    let rayAngle = this.angle - degreesToRadians(halfOfPlayerFOV);
    let angleIncrement = degreesToRadians(angleBetweenSubsequentRays);

    //TODO: loop for all the rays
    // this.castRay(rayAngle);
    //
    for(let r = 0; r < projectionPlaneWidth; r += 1) {
      this.castRay(rayAngle, r);
      drawLine(
        this.x,
        this.y,
        this.x + this.radius * rayDirectionLineMultiplier * Math.cos(rayAngle),
        this.y + this.radius * rayDirectionLineMultiplier * Math.sin(rayAngle),
        rayDirectionLineWidth,
        rayDirectionLineColor,
        mapContext
      );
      rayAngle += angleIncrement;
    }
  }
}//class Player

class FrameCounter {
  constructor(timeStart) {
    this.timeStart = timeStart;
    this.counter = 0;
    this.fps = 0;
    this.$fps = null;
  }

  create() {
    this.$fps = document.createElement('div');
    this.$fps.style.position = 'fixed';
    this.$fps.style.right = '5px';
    this.$fps.style.bottom = '5px';
    this.$fps.style.color = '#49C431';
    this.$fps.style.background = 'transparent';
    this.$fps.style.font = '1.5em monospace';
    this.$fps.style.zIndex = 1000;
    document.getElementsByTagName('body')[0].appendChild(this.$fps);
  }

  frameCount() {
    const now = performance.now();
    const duration = now - this.timeStart;
    if (duration < 1000) {
      this.counter++;
    } else {
      this.fps = this.counter;
      this.counter = 0;
      this.timeStart = now;
      this.$fps.textContent = `${this.fps} FPS`;
    }
    requestAnimationFrame(() => this.frameCount(this.timeStart));
  }
}

//////////////////////////////////////////////////////////////////////
///////////////////////////////engine/////////////////////////////////
//////////////////////////////////////////////////////////////////////

const player = new Player(playerStartingPosition.x, playerStartingPosition.y, playerRadius, playerColor, mapContext);

const fpsCounter = new FrameCounter(performance.now());
fpsCounter.create();
fpsCounter.frameCount();

function draw() {
  //view
  clearCanvas(viewElementWidth, viewElementHeight, viewContext);
  // log(
  //   `player.angle = ${radiansToDegrees(player.angle)}`,
  //   10,
  //   180
  // );
  //sky
  drawFillRect(
    0,
    0,
    projectionPlaneWidth,
    halfOfProjectionPlaneHeight,
    skyColor,
    viewContext
  );
  //floor
  drawFillRect(
    0,
    halfOfProjectionPlaneHeight,
    projectionPlaneWidth,
    halfOfProjectionPlaneHeight,
    floorColor,
    viewContext
  );
  
  //map
  clearCanvas(mapElementWidth, mapElementHeight, mapContext);
  drawMap();
  player.move();
  player.castRays();
  player.draw();
  // viewContext.drawImage(textures[0], 110, 0, 64, 64);
  // viewContext.drawImage(textures[0], 0, 0, 1, 64, 100, 0, 1, 64);
}

function loadTextures() {
  let loaded = false;
  let imagesCounter = 0;
  for (let i = 0; i < texturesSrc.length; i += 1) {
    let img = document.createElement('img');
    img.src = texturesSrc[i];
    img.addEventListener('load', () => {
      //textures.push(img);
      textures[i] = img;
      imagesCounter++;
      if (imagesCounter === texturesSrc.length) {
        loaded = true;
        if (loaded) {
          //create shadowed textures
          let shadowedCounter = 0;
          let isShadowedLoaded = false;
          for (let j = 0; j < textures.length; j += 1) {
            let img = textures[j];
            let canvas = document.createElement('canvas');
            let width = canvas.width = img.width;
            let height = canvas.height = img.height;
            let context = canvas.getContext('2d');
            context.drawImage(img, 0, 0);
            let imageData = context.getImageData(0, 0, width, height);
            for (let k = 3; k < imageData.data.length; k += 4) {
              imageData.data[k - 1] = floor(imageData.data[k - 1] / 2);
              imageData.data[k - 2] = floor(imageData.data[k - 2] / 2);
              imageData.data[k - 3] = floor(imageData.data[k - 3] / 2);
            }
            context.putImageData(imageData, 0, 0);
            let shadowedSrc = canvas.toDataURL('image/png', 0.1);
            let shadowedImg = document.createElement('img');
            shadowedImg.src = shadowedSrc;
            shadowedImg.addEventListener('load', () => {
              shadowedCounter++;
              // shadowedTextures.push(shadowedImg);
              shadowedTextures[j] = shadowedImg;
              if (shadowedCounter === textures.length) {
                //start when all resouces are created and loaded
                isShadowedLoaded = true;
                document.getElementById('loading').style.display = 'none';
                loop();
              }
            });
          }
          // loop();
        }
      }
    });
  }
}

function loop() {
  draw();
  requestAnimationFrame(loop);
}

function onKeyDown(event) {
  switch(event.key) {
    case 'ArrowLeft':
    case 'a':
      player.turnDirection = -1; break;
    case 'ArrowUp':
    case 'w':
      player.moveDirection = 1; break;
    case 'ArrowRight':
    case 'd':
      player.turnDirection = 1; break;
    case 'ArrowDown':
    case 's':
      player.moveDirection = -1; break;
  }
}

function onKeyUp(event) {
  switch(event.key) {
    case 'ArrowLeft':
    case 'a':
      player.turnDirection = 0; break;
    case 'ArrowUp':
    case 'w':
      player.moveDirection = 0; break;
    case 'ArrowRight':
    case 'd':
      player.turnDirection = 0; break;
    case 'ArrowDown':
    case 's':
      player.moveDirection = 0; break;
  }
}

document.getElementById('close').addEventListener('click', () => {
  document.getElementById('info').style.display = 'none';
});
window.addEventListener('keydown', onKeyDown, false);
window.addEventListener('keyup', onKeyUp, false);
window.addEventListener('load', loadTextures, false);



