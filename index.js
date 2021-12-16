const query = document.getElementById("parser");
const button = document.getElementById("parseButton");
const regex = /^>.*/im;

let isSuccess = false;
let errorMsg = "";

let storage = {
  stackStorage: [],
  symbolStorage: [],
  inputStorage: [],
  actionStorage: [],
};

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
  let skip = false;
  let string = "";

  for (let i = 0; i < rawString.length; i++) {
    const char = rawString[i];
    console.log(char);
    switch (char) {
      case '"':
        break;
      case "<":
        if (string.length > 0) {
          input += "s";
          string = "";
        }
        input += "<";
        isOpen = true;
        isTag = true;
        break;
      case ">":
        if (string.length > 0) {
          if (isTag) input += "t";
          else input += "p";
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
        }
        break;
      case "\\":
        skip = true;
        break;
      case " ":
        if (isOpen && isTag) {
          input += "t";
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
  input += ";";
  input = input.split("").join(" ");
  return input;
};

const parser = (string) => {
  input = string.split(" ");
  console.log(input);

  let stack = [0];
  let symbols = [];
  let remain = input;

  storage = {
    stackStorage: [stack],
    symbolStorage: [symbols],
    inputStorage: [remain],
    actionStorage: [],
  };
};

const tableSelector = ([stack, symbols, input]) => {
  const data = [stack, symbols, input];

  const currentState = stack[stack.length - 1];
  const currentSymbol = symbols[stack.length - 1];
  const firstText = input[0];

  const result = [];

  // const errorMaker = (firstText) => {};

  switch (currentState) {
    case 0:
      {
        if (firstText === "<") shiftFunc(3, data);
        else if (currentSymbol === "S") gotoFunc(1, data);
        else if (currentSymbol === "A") gotoFunc(2, data);
        else makeError("gg");
      }
      break;
    case 1:
      {
        if (firstText === "$") {
          isSuccess = true;
          return true;
        } else makeError("gg");
      }
      break;
    case 2:
      {
        if (firstText === ";") shiftFunc(4, data);
        else makeError("gg");
      }
      break;
    case 3:
      {
        if (firstText === "t") shiftFunc(6, data);
        else if (currentSymbol === "B") gotoFunc(5, data);
        else makeError("gg");
      }
      break;
    case 4:
      {
        if (firstText === "$") reduceFunc(1, data);
        else makeError("gg");
      }
      break;
    case 5:
      {
        if (firstText === ";") reduceFunc(2, data);
        else makeError("gg");
      }
      break;
    case 6:
      {
        if (firstText === ">") reduceFunc(10, data);
        else if (firstText === "p") shiftFunc(8, data);
        else if (currentSymbol === "P") gotoFunc(7, data);
        else makeError("gg");
      }
      break;
    case 7:
      {
        if (firstText === ">") shiftFunc(10, data);
        else if (currentSymbol === "C") gotoFunc(9, data);
        else makeError("gg");
      }
      break;
    case 8:
      {
        if (firstText === ">") reduceFunc(9, data);
        else makeError("gg");
      }
      break;
    case 9:
      {
        if (firstText === ";") reduceFunc(3, data);
        else if (firstText === "<") reduceFunc(3, data);
        else if (firstText === "/") reduceFunc(3, data);
        else if (firstText === "s") reduceFunc(3, data);
        else makeError("gg");
      }
      break;
    case 10:
      {
        if (firstText === "<") shiftFunc(12, data);
        else if (firstText === "/") reduceFunc(7, data);
        else if (firstText === "s") shiftFunc(14, data);
        else if (currentSymbol === "D") gotoFunc(11, data);
        else if (currentSymbol === "E") gotoFunc(13, data);
        else makeError("gg");
      }
      break;
    case 11:
      {
        if (firstText === "/") shiftFunc(15, data);
        else makeError("gg");
      }
      break;
    case 12:
      {
        if (firstText === "t") shiftFunc(6, data);
        else if (currentSymbol === "B") gotoFunc(16, data);
        else makeError("gg");
      }
      break;
    case 13:
      {
        if (firstText === "<") shiftFunc(12, data);
      }
      break;
    case 14:
      break;
    case 15:
      break;
    case 16:
      break;
    case 17:
      break;
    case 18:
      break;
    case 19:
      break;
    case 20:
      break;
    default:
      break;
  }
};

const shiftFunc = (shiftNum, [stack, symbols, input]) => {
  stack.push(shiftNum);
  symbols.push(input[0]);
  input.shift();

  storage = {
    ...storage,
    stackStorage: [...storage.stackStorage, stack],
    symbolStorage: [...storage.symbolStorage, symbols],
    inputStorage: [...storage.inputStorage, input],
    actionStorage: [...storage.actionStorage, `shift ${shiftNum}`],
  };

  return tableSelector([stack, symbols, input]);
};

const gotoFunc = (goto, [stack, symbols, input]) => {
  stack.push(goto);

  storage = {
    ...storage,
    stackStorage: [...storage.stackStorage, stack],
    actionStorage: [...storage.actionStorage, `goto ${goto}`],
  };
  return tableSelector([stack, symbols, input]);
};

const reduceData = (reduceNum) => {
  switch (reduceNum) {
    case 1:
      return [2, "S", "S -> A ;"];
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
      return [2, "S", "S -> A;"];
  }
};

const reduceFunc = (reduceNum, [stack, symbols, input]) => {
  const [n, symbol, rule] = reduceData(reduceNum);

  stack.splice(-n, n);
  symbols.splice(-n, n);
  symbols.push(symbol);

  storage = {
    ...storage,
    stackStorage: [...storage.stackStorage, stack],
    symbolStorage: [...storage.symbolStorage, symbols],
    actionStorage: [...storage.actionStorage, `reduce (${reduceNum}) ${rule}`],
  };

  return tableSelector([stack, symbols, input]);
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
