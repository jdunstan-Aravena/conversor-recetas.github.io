document.getElementById('recipeForm').addEventListener('submit', function(e) {
  e.preventDefault();

  const metricSystem = document.getElementById('metricSystem').value;
  const ingredients = document.getElementById('ingredients').value.split('\n');
  const originalServings = parseInt(document.getElementById('originalServings').value);
  const desiredServings = parseInt(document.getElementById('desiredServings').value);

  const convertedIngredients = convertRecipe(ingredients, originalServings, desiredServings, metricSystem);

  displayResult(convertedIngredients);
});

document.getElementById('metricSystem').addEventListener('change', function() {
  const metricSystem = this.value;
  const ingredientsTextarea = document.getElementById('ingredients');

  if (metricSystem === 'american') {
    ingredientsTextarea.placeholder = "Ejemplo:\n2 tazas harina\n1 cdta sal\n3 cda azucar";
  } else if (metricSystem === 'british') {
    ingredientsTextarea.placeholder = "Ejemplo:\n2 tazas harina\n1 cdta sal\n3 cda azucar\n8 oz leche\n1 libra mantequilla";
  }
});

function roundQuantity(quantity, unit, name) {
  quantity = Number(quantity);
  if (isNaN(quantity)) return '';

  // Lógica personalizada para redondeo
  if (unit.toLowerCase().includes('fl oz')) {
    if (quantity <= 0.25) {
      quantity = 0.25;
    } else if (quantity > 0.25 && quantity <= 0.5) {
      quantity = 0.5;
    } else if (quantity > 0.5 && quantity <= 0.75) {
      quantity = 0.75;
    } else {
      quantity = Math.ceil(quantity); // Redondear al entero superior más cercano
    }
  } else if (name.toLowerCase().includes('tomates')) {
    quantity = Math.round(quantity / 50) * 50;
  } else if (name.toLowerCase().includes('ajo')) {
    quantity = quantity < 1 && quantity > 0 ? 0.5 : Math.round(quantity);
  } else if (name.toLowerCase().includes('caldo') || name.toLowerCase().includes('crema')) {
    quantity = quantity < 1 && quantity > 0 ? 0.5 : Math.round(quantity / 10) * 10;
  } else if (unit.toLowerCase().includes('cda') || unit.toLowerCase().includes('cdta') || 
             unit.toLowerCase().includes('cucharada') || unit.toLowerCase().includes('cucharadita')) {
    if (quantity <= 0.25) {
      quantity = 0.25;
    } else if (quantity > 0.25 && quantity <= 0.5) {
      quantity = 0.5;
    } else if (quantity > 0.5 && quantity <= 0.75) {
      quantity = 0.75;
    } else {
      quantity = Math.ceil(quantity);
    }
  } else if (quantity < 1 && quantity > 0) {
    if (quantity >= 0.9) {
      quantity = Math.ceil(quantity); // Redondear hacia arriba si se acerca a 1
    } else {
      quantity = parseFloat(quantity).toFixed(1);
      quantity = Number(quantity);
    }
  } else {
    quantity = Math.round(quantity);
  }

  return (quantity % 1 === 0) ? Number(quantity.toFixed(0)) : Number(quantity.toFixed(2));
}

function convertRecipe(ingredients, originalServings, desiredServings, metricSystem) {
  const ratio = desiredServings / originalServings;

  return ingredients.map(ingredient => {
    const parts = ingredient.trim().split(' ');

    if (ingredient.toLowerCase().includes('a gusto')) {
      return { original: ingredient, converted: ingredient };
    }

    if (parts.length < 3 || isNaN(parseFloat(parts[0]))) {
      return { original: ingredient, converted: ingredient };
    }

    let quantity = parseFloat(parts[0]);
    let unit = parts[1];
    let name = parts.slice(2).join(' ');

    quantity = convertQuantity(quantity, ratio, unit, name);

    if (isNaN(quantity)) {
      return { original: ingredient, converted: ingredient };
    }

    const adjustedUnit = adjustUnit(quantity, unit, metricSystem);
    quantity = adjustedUnit.quantity;
    unit = adjustedUnit.unit;

    quantity = roundQuantity(quantity, unit, name);

    if (!isNaN(quantity)) {
      quantity = (quantity % 1 === 0) ? quantity.toFixed(0) : quantity.toFixed(2);
    } else {
      quantity = ''; // Retornar cadena vacía si `quantity` no es un número válido
    }

    return {
      original: ingredient,
      converted: `${quantity} ${unit} ${name}`.trim()
    };
  });
}

function convertQuantity(quantity, ratio, unit, name) {
  let adjustedQuantity;

  // Aplicar un factor de escalado no lineal
  if (ratio > 1) {
    adjustedQuantity = quantity * Math.pow(ratio, 0.85); // Aumentar menos agresivamente
  } else {
    adjustedQuantity = quantity * Math.pow(ratio, 1.15); // Disminuir más agresivamente
  }

  // Conversiones especiales para ciertos ingredientes
  if (name.toLowerCase().includes('huevos')) {
    adjustedQuantity = Math.round(adjustedQuantity); // Redondear para huevos
  } else if (name.toLowerCase().includes('sal') || name.toLowerCase().includes('pimienta')) {
    adjustedQuantity *= Math.sqrt(ratio); // Escalar especias aún menos agresivamente
  }

  return adjustedQuantity;
}

function adjustUnit(quantity, unit, metricSystem) {
  const conversions = {
    american: {
      'taza': { threshold: 4, newUnit: 'cuarto', factor: 0.25 },
      'cda': { threshold: 16, newUnit: 'taza', factor: 1/16 },
      'cdta': { threshold: 3, newUnit: 'cda', factor: 1/3 },
      'onza': { threshold: 16, newUnit: 'libra', factor: 1/16 },
    },
    british: {
      'ml': { threshold: 1000, newUnit: 'l', factor: 0.001 },
      'g': { threshold: 1000, newUnit: 'kg', factor: 0.001 },
    }
  };

  const systemConversions = conversions[metricSystem];
  if (systemConversions && systemConversions[unit]) {
    const { threshold, newUnit, factor } = systemConversions[unit];
    if (quantity >= threshold) {
      return { quantity: quantity * factor, unit: newUnit };
    }
  }

  return { quantity, unit };
}

function displayResult(convertedIngredients) {
  const resultDiv = document.getElementById('result');
  resultDiv.innerHTML = '<h2>Receta Convertida:</h2>';

  convertedIngredients.forEach(item => {
    const div = document.createElement('div');
    div.className = 'result-item';
    div.innerHTML = `
      <span>${item.original}</span>
      <span>→</span>
      <strong>${item.converted}</strong>
    `;
    resultDiv.appendChild(div);
  });
}