const query = document.getElementById("parser");
const button = document.getElementById("parseButton");
const regex = /^>.*/im;

const doParse = () => {
  const value = JSON.stringify(query.value);
  console.log(value);

  let isSuccess = false;
  let errorMsg = "";

  const makeError = (msg) => {
    isSuccess = true;
    errorMsg = msg;
  };

  if (value.length < 1) {
    errorMsg = "Input is empty.";
  } else {
    saveStorage(query.value, "raw");

    const rawString = value.replace(/\r\n\s+/g, "");
    console.log(rawString);

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
    input = input.split("").join(" ");
    console.log(input);
  }

  if (isSuccess) alert("No error - Parsed successfully.");
  else alert("Error! " + errorMsg);
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
