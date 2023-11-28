function createLabeledInput(details) {
  const inputElement = document.createElement("input");

  inputElement.type = details.type;
  inputElement.id = details.id;

  if (details.type === "text" || details.type === "number") {
    inputElement.value = details.value;
  } else if (details.type === "checkbox") {
    inputElement.checked = details.value;
  }

  if (details.maximum !== undefined) {
    inputElement.max = details.maximum;

    inputElement.addEventListener("input", function () {
      const max = parseFloat(this.max);

      if (this.valueAsNumber > max) {
        this.value = max;
      }
    });
  }

  if (details.minimum !== undefined) {
    inputElement.min = details.minimum;

    inputElement.addEventListener("input", function () {
      const min = parseFloat(this.min);

      if (this.valueAsNumber < min) {
        this.value = min;
      }
    });
  }

  if (details.callback !== undefined) {
    const eventType = details.callback.eventType;
    const callbackFunc = details.callback.callbackFunc;
    inputElement.addEventListener(eventType, callbackFunc);
  }

  const labeledInput = document.createElement("div");
  const label = document.createElement("p");
  label.innerHTML = details.label;
  labeledInput.className = "labeledInput";
  labeledInput.appendChild(label);
  labeledInput.appendChild(inputElement);

  return labeledInput;
}

function createMenuOption(details) {
  const parentContainer = details.parentContainer;
  const menuOptionContainer = document.createElement("div");
  const header = document.createElement("h1");
  header.innerHTML = details.header;
  header.className = "menuOptionHeader";
  menuOptionContainer.appendChild(header);

  details.children.forEach((child) => {
    menuOptionContainer.appendChild(child);
  });

  parentContainer.className = "menuOption";
  parentContainer.appendChild(menuOptionContainer);
}

function createElement(details) {
  if (details.element === undefined) {
    throw new Error('Element needs an HTMLElement type');
  }

  const element = document.createElement(details.element);

  if (details.type !== undefined) {
    element.type = details.type;
  }

  if (details.id !== undefined) {
    element.id = details.id;
  }

  if (details.className !== undefined) {
    element.className = details.className
  }

  if (details.min !== undefined) {
    element.min = details.min;
  }

  if (details.max !== undefined) {
    element.max = details.max;
  }

  if (details.value !== undefined) {
    element.value = details.value;
  }

  if (details.styles !== undefined) {
    details.styles.forEach(style => {
      for (const property in style) {
        element.style[property] = style[property];
      }
    });
  }

  if (details.innerHTML !== undefined) {
    element.innerHTML = details.innerHTML;
  }

  if (details.callbacks !== undefined) {
    details.callbacks.forEach(callback => {
      element.addEventListener(callback.eventType, callback.callbackFunc);
    });
  }


  return element;
}