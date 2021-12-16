const query = document.getElementById("parser");
const button = document.getElementById("parseButton");
const regex = /^>.*/im;

let isSuccess = false;
let errorMsg = "";

let storage = [];

const makeError = (msg) => {
  isSuccess = true;
  errorMsg = msg;
};

const doParse = () => {
  const value = JSON.stringify(query.value);
  console.log(value);

  if (value.length < 1) {
    errorMsg = "Input is empty.";
  } else {
    saveStorage(query.value, "raw");

    const rawString = value.replace(/\r\n\s+/g, "");
    console.log(rawString);

    let input = lexer(rawString);
    console.log(input);
    parser(input);
  }

  if (isSuccess) alert("No error - Parsed successfully.");
  else alert("Error! " + errorMsg);
};

const lexer = (rawString) => {
  let input = "";
  let isOpen = false;
  let isTag = false;
  let isCloseTag = false;
  let skip = false;
  let string = "";

  let tags = [];
  let closeTags = [];
  let tagErr = [];

  for (let i = 0; i < rawString.length; i++) {
    const char = rawString[i];
    // console.log(char);
    // console.log(tags);

    switch (char) {
      case '"':
        break;
      case "<":
        if (string.length > 0) {
          if (isOpen && isTag) {
            input += "t";
            tags.push(string);
          } else {
            input += "s";
          }

          string = "";
        }
        input += "<";
        isOpen = true;
        isTag = true;
        break;
      case ">":
        if (string.length > 0) {
          if (isTag) {
            input += "t";
            if (isCloseTag) {
              closeTags.push(string);
              // tags.push("/" + string);
              if (tags.length > 0 && tags[tags.length - 1] == string)
                tags.pop();
              else if (tags.length < 1) {
                tagErr.push("end tag is expected");
              } else if (tags.length > 0 && tags[tags.length - 1] != string) {
                tagErr.push("start tag and end tag is not same");
                tags.pop();
              }

              isCloseTag = false;
            } else {
              tags.push(string);
            }
          } else input += "p";

          string = "";
        }
        isOpen = false;
        isTag = false;
        input += ">";
        break;
      case "/":
        if (isOpen) {
          input = input.slice(0, -1);
          input += "/";
          isCloseTag = true;
        }
        break;
      case "\\":
        skip = true;
        break;
      case " ":
        if (isOpen && isTag) {
          input += "t";
          tags.push(string);
          isTag = false;
          string = "";
        }
        break;
      default:
        if (skip) {
          skip = false;
          break;
        }
        string += char;
        break;
    }
  }

  console.log(tags);
  console.log(closeTags);

  if (tags.length > 0) {
    tagErr.push("start tag is expected");
  }

  if (tagErr.length > 0) {
    tagErr = Array.from(new Set(tagErr));
    alert(tagErr.join(" "));
    console.log(tagErr);
  }

  input += "$";
  input = input.split("").join(" ");
  return input;
};

const parser = (string) => {
  input = string.split(" ");
  console.log(input);

  let stack = [0];
  let symbols = [];
  let remain = input;

  storage.push({
    stack: stack.join(" "),
    symbol: symbols.join(" "),
    input: remain.join(" "),
    action: " ",
    error: " ",
  });

  tableSelector([stack, symbols, remain]);

  console.log(storage);

  let tableBody = document.getElementById("table");

  let tbody = document.createElement("tbody");
  tableBody.appendChild(tbody);

  storage.forEach((val, index) => {
    let newRow = document.createElement("tr");
    tbody.appendChild(newRow);

    let indexCell = document.createElement("th");
    indexCell.setAttribute("col", "row");
    indexCell.textContent = index + 1;
    newRow.appendChild(indexCell);

    let stackCell = document.createElement("td");
    stackCell.textContent = val.stack;
    newRow.appendChild(stackCell);

    let symbolCell = document.createElement("td");
    symbolCell.textContent = val.symbol;
    newRow.appendChild(symbolCell);

    let inputCell = document.createElement("td");
    inputCell.textContent = val.input;
    newRow.appendChild(inputCell);

    let actionCell = document.createElement("td");
    actionCell.textContent = val.action;
    newRow.appendChild(actionCell);

    let errorCell = document.createElement("td");
    errorCell.textContent = val.error;
    newRow.appendChild(errorCell);
  });
};

const tableSelector = ([stack, symbols, input]) => {
  const data = [stack, symbols, input];

  // console.log("---------------------------------------------");
  // console.log(stack);
  // console.log(symbols);
  // console.log(input.join(" "));

  const currentState = stack[stack.length - 1];
  const currentSymbol = symbols[symbols.length - 1];
  const firstText = input[0];

  let result = data;
  let isParseSuccess = false;
  let isError = false;

  const errorMaker = (firstText) => {
    isError = true;
    makeError(firstText);
    alert(firstText);
  };
  // console.log("currentState, currentSymbol, firstText");
  // console.log(currentState, currentSymbol, firstText);
  // console.log("\n");

  switch (currentState) {
    case 0:
      {
        if (firstText === "<") result = shiftFunc(3, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 1:
      {
        if (firstText === "$") {
          isSuccess = true;
          isParseSuccess = true;
        } else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 2:
      {
        if (firstText === "$") result = reduceFunc(1, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 3:
      {
        if (firstText === "t") result = shiftFunc(5, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 4:
      {
        if (firstText === "$") result = reduceFunc(2, data);
        // else result = errorFunc(2, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 5:
      {
        if (firstText === ">") result = reduceFunc(10, data);
        else if (firstText === "p") result = shiftFunc(7, data);
        else result = errorFunc(1, data);
      }
      break;
    case 6:
      {
        if (firstText === ">") result = shiftFunc(9, data);
        else result = errorFunc(1, data);
      }
      break;
    case 7:
      {
        if (firstText === ">") result = reduceFunc(9, data);
        else result = errorFunc(1, data);
      }
      break;
    case 8:
      {
        if (firstText === "$") result = reduceFunc(3, data);
        else if (firstText === "<") result = reduceFunc(3, data);
        else if (firstText === "/") result = reduceFunc(3, data);
        else if (firstText === "s") result = reduceFunc(3, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 9:
      {
        if (firstText === "<") result = shiftFunc(11, data);
        else if (firstText === "/") result = reduceFunc(7, data);
        else if (firstText === "s") result = shiftFunc(13, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 10:
      {
        if (firstText === "/") result = shiftFunc(14, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 11:
      {
        if (firstText === "t") result = shiftFunc(5, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 12:
      {
        if (firstText === "<") result = shiftFunc(11, data);
        else if (firstText === "/") result = reduceFunc(7, data);
        else if (firstText === "s") result = shiftFunc(13, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 13:
      {
        if (firstText === "<") result = reduceFunc(8, data);
        else if (firstText === "/") result = reduceFunc(8, data);
        else if (firstText === "s") result = reduceFunc(8, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 14:
      {
        if (firstText === "t") result = shiftFunc(17, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 15:
      {
        if (firstText === "<") result = shiftFunc(11, data);
        else if (firstText === "/") result = reduceFunc(7, data);
        else if (firstText === "s") result = shiftFunc(13, data);
        // else result = errorFunc(3, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 16:
      {
        if (firstText === "/") result = reduceFunc(6, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 17:
      {
        if (firstText === ">") result = shiftFunc(19, data);
        else result = errorFunc(1, data);
      }
      break;
    case 18:
      {
        if (firstText === "/") result = reduceFunc(5, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    case 19:
      {
        if (firstText === "$") result = reduceFunc(4, data);
        else if (firstText === "<") result = reduceFunc(4, data);
        else if (firstText === "/") result = reduceFunc(4, data);
        else if (firstText === "s") result = reduceFunc(4, data);
        else errorMaker(`${currentState}, ${currentSymbol}, ${firstText}`);
      }
      break;
    default:
      break;
  }

  // console.log(storage);

  if (isError) {
    alert("error!");
  } else if (isParseSuccess) {
    alert("success!");
    console.log(result);
  } else tableSelector(data);
};

const shiftFunc = (shiftNum, [stack, symbols, input]) => {
  stack.push(shiftNum);
  symbols.push(input[0]);
  input.shift();

  storage.push({
    stack: stack.join(", "),
    symbol: symbols.join(", "),
    input: input.join(", "),
    action: `shift ${shiftNum}`,
    error: " ",
  });

  return [stack, symbols, input];
};

const reduceData = (reduceNum) => {
  switch (reduceNum) {
    case 1:
      return [1, "S", "S -> A"];
    case 2:
      return [2, "A", "A -> < B"];
    case 3:
      return [3, "B", "B -> t P C"];
    case 4:
      return [5, "C", "C -> > D / t >"];
    case 5:
      return [3, "D", "D -> < B D"];
    case 6:
      return [2, "D", "D -> E D"];
    case 7:
      return [0, "D", "D -> ε"];
    case 8:
      return [1, "E", "E -> s"];
    case 9:
      return [1, "P", "P -> p"];
    case 10:
      return [0, "P", "P -> ε"];
    default:
      return [1, "S", "S -> A"];
  }
};

const reduceFunc = (reduceNum, [stack, symbols, input]) => {
  const [n, symbol, rule] = reduceData(reduceNum);

  stack.splice(-n, n);
  symbols.splice(-n, n);
  symbols.push(symbol);

  storage.push({
    stack: stack.join(", "),
    symbol: symbols.join(", "),
    input: input.join(", "),
    action: `reduce (${reduceNum}) ${rule}`,
    error: " ",
  });

  const currentState = stack[stack.length - 1];
  const data = [stack, symbols, input];

  switch (symbol) {
    case "S":
      if (currentState === 0) return gotoFunc(1, data);
      else return data;
    case "A":
      if (currentState === 0) return gotoFunc(2, data);
      else return data;
    case "B":
      if (currentState === 3) return gotoFunc(4, data);
      else if (currentState === 11) return gotoFunc(15, data);
      else return data;
    case "C":
      if (currentState === 6) return gotoFunc(8, data);
      else return data;
    case "D":
      if (currentState === 9) return gotoFunc(10, data);
      else if (currentState === 12) return gotoFunc(16, data);
      else if (currentState === 15) return gotoFunc(18, data);
      else return data;
    case "E":
      if (currentState === 9) return gotoFunc(12, data);
      else if (currentState === 12) return gotoFunc(12, data);
      else if (currentState === 15) return gotoFunc(12, data);
      else return data;
    case "P":
      if (currentState === 5) return gotoFunc(6, data);
      else return data;
    default:
      return data;
  }
};

const gotoFunc = (goto, [stack, symbols, input]) => {
  stack.push(goto);

  storage.push({
    stack: stack.join(", "),
    symbol: symbols.join(", "),
    input: input.join(", "),
    action: `goto ${goto}`,
    error: " ",
  });

  return [stack, symbols, input];
};

const errorFunc = (errType, [stack, symbols, input]) => {
  let newInput = input;

  switch (errType) {
    case 1:
      {
        newInput = input.unshift(">");

        storage.push({
          stack: stack.join(", "),
          symbol: symbols.join(", "),
          input: input.join(", "),
          action: "error",
          error: "bracket for tag is expected",
        });
      }
      break;
    // case 2:
    //   {
    //     newInput = input.splice(0, 3);
    //     storage = {
    //       stackStorage: [...storage.stackStorage, stack.join(", ")],
    //       symbolStorage: [...storage.symbolStorage, symbols.join(", ")],
    //       inputStorage: [...storage.inputStorage, input.join(", ")],
    //       actionStorage: [...storage.actionStorage, `error`],
    //       errorStorage: [...storage.errorStorage, "start tag is expected"],
    //     };
    //   }
    //   break;
    // case 3:
    //   {
    //     newInput = ["/", "t", ">", ...input];
    //     storage = {
    //       stackStorage: [...storage.stackStorage, stack.join(", ")],
    //       symbolStorage: [...storage.symbolStorage, symbols.join(", ")],
    //       inputStorage: [...storage.inputStorage, input.join(", ")],
    //       actionStorage: [...storage.actionStorage, `error`],
    //       errorStorage: [...storage.errorStorage, "end tag is expected"],
    //     };
    //   }
    //   break;
    default:
      break;
  }

  return [stack, symbols, newInput];
};

const saveStorage = (data, type) => {
  if (type === "raw") {
    const parsedData = JSON.stringify(data);
    localStorage.setItem("raw_string", parsedData);
  } else {
  }
};

const loadStorage = async () => {
  try {
    const loadedRawData = await localStorage.getItem("raw_string");
    const loadedParsedRawData = JSON.parse(loadedRawData);
    query.value = loadedParsedRawData;
  } catch (error) {}
};

window.onload = function () {
  loadStorage();
};
