import React, { useEffect, useState } from 'react';
import { TextField } from '@mui/material';

// Utility function to format the RUT to XX.XXX.XXX-X
const formatRUT = (rut) => {
  if (!rut) return '';
  
  // Allow numeric characters and 'K'/'k'
  let cleaned = rut.replace(/[^0-9kK]/g, ''); 
  if (cleaned.length <= 1) return cleaned; // If too short, return as is
  
  // Format with dots and hyphen
  let body = cleaned.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  let dv = cleaned.slice(-1).toUpperCase(); // Last character is the DV, always in uppercase
  return `${body}-${dv}`;
};

// Validate the RUT with a check digit algorithm
const validateRUT = (rut) => {
  const formattedRUT = formatRUT(rut);
  const match = formattedRUT.match(/^(\d{1,8})-?([0-9kK])$/);

  if (!match) return false;

  const body = match[1];
  const dv = match[2].toUpperCase(); // Ensure DV is always uppercase

  // Validation logic
  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += body[i] * multiplier;
    multiplier = (multiplier === 7) ? 2 : multiplier + 1;
  }

  const expectedDV = (11 - (sum % 11)) % 11;
  const expectedDVChar = expectedDV === 10 ? 'K' : expectedDV.toString();

  return expectedDVChar === dv;
};

const RutInput = ({ value, onChange, onBlur, error, label = "RUT" }) => {
  const [rut, setRut] = useState(value || '');

  useEffect(() => {
    setRut(value);
  }, [value]);

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const formattedValue = formatRUT(inputValue); // Format RUT including K
    setRut(formattedValue); // Set formatted value
    onChange(formattedValue); // Pass formatted value to parent
  };

  const handleBlur = () => {
    // Validate on blur but don't reset the value
    if (!validateRUT(rut)) {
      // Optionally, you can set an error here or handle it with the error prop
    }
    onBlur(); // Call onBlur to inform the parent
  };

  return (
    <TextField
      label={label}
      value={rut}
      onChange={handleChange}
      onBlur={handleBlur}
      fullWidth
      variant="outlined"
      error={!!error}
      helperText={error || ""}
      placeholder="12.345.678-9"
    />
  );
};

export default RutInput;
