import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { Button, Typography, Box, Grid, Container, Paper } from '@mui/material';
import RutInput from './components/RutInput';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

// Dummy test data with enhanced location details
const DUMMY_DATA = {
  nombre: "John Doe",
  rut: "12.345.678-9", 
  observacion: "Test observation note",
  juntaVecinos: "Neighborhood Association 'Las Flores'",
  direccionRetiro: "Community Center - 123 Main Avenue, Building B, Floor 2",
  location: "Santiago Metropolitan Region",
  pickupLocation: "Distribution Center - 456 Central Plaza, Local #12",
  gifts: [
    {
      name: "Gift 1",
      status: "green",
      observacion: ""
    },
    {
      name: "Gift 2",
      status: "red", 
      observacion: "Rejected due to test reason"
    },
    {
      name: "Gift 3",
      status: "yellow",
      observacion: "Approved with test note"
    },
    {
      name: "Gift 4", 
      status: "black",
      observacion: ""
    }
  ]
};

const App = () => {
  return (
    <Router basename="/gifts">
      <Routes>
        <Route path="/" element={<RutForm />} />
        <Route path="/results" element={<Results />} />
      </Routes>
    </Router>
  );
};

const RutForm = () => {
  const navigate = useNavigate();
  const initialValues = { rut: '' };

  const validateRut = (rut) => {
    const normalizedRut = rut.replace(/\./g, '').replace(/\s/g, '');
    const rutRegex = /^\d{1,8}-[\dkK]$/;
    return rutRegex.test(normalizedRut) ? null : 'Invalid RUT.';
  };

  const validate = (values) => {
    const errors = {};
    if (!values.rut) {
      errors.rut = 'RUT is required';
    } else {
      const rutError = validateRut(values.rut);
      if (rutError) {
        errors.rut = rutError;
      }
    }
    return errors;
  };

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const formattedRUT = values.rut.trim();
      const response = await axios.get(`${API_URL}?rut=${encodeURIComponent(formattedRUT)}`);

      if (response.data.success) {
        navigate('/results', { state: { data: response.data.data } });
      } else {
        console.log('Using dummy data for testing');
        navigate('/results', { state: { data: DUMMY_DATA } });
      }
    } catch (error) {
      console.log('Using dummy data due to error');
      navigate('/results', { state: { data: DUMMY_DATA } });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Formik initialValues={initialValues} validate={validate} onSubmit={handleSubmit}>
        {({ setFieldValue, setFieldTouched, errors, values, touched, isSubmitting }) => (
          <Form>
            <Paper elevation={6} sx={{
              mt: 8,
              mb: 4,
              p: 4,
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}>
              <Box mb={4} textAlign="center">
                <img
                  src="https://placehold.co/1200x300/2196f3/ffffff?text=Gift+Distribution+System"
                  alt="Banner"
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    maxHeight: '200px',
                    objectFit: 'cover'
                  }}
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h4" align="center" sx={{
                    fontWeight: 700,
                    background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 4
                  }}>
                    Gift Application Status Check
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <RutInput
                    value={values.rut}
                    onChange={(value) => setFieldValue('rut', value)}
                    onBlur={() => setFieldTouched('rut')}
                    error={touched.rut && !!errors.rut}
                  />
                </Grid>

                {touched.rut && errors.rut && (
                  <Grid item xs={12}>
                    <Typography color="error" sx={{ textAlign: 'center' }}>
                      {errors.rut}
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12} sx={{ textAlign: 'center' }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    disabled={isSubmitting}
                    sx={{
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      color: 'white',
                      px: 4,
                      py: 1.5,
                      borderRadius: '25px',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #21CBF3 30%, #2196F3 90%)',
                      }
                    }}
                  >
                    Check Status
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Form>
        )}
      </Formik>
    </Container>
  );
};

const Results = () => {
  const location = useLocation();
  const query = new URLSearchParams(window.location.search);
  const rut = query.get('rut');
  const navigate = useNavigate();

  const [data, setData] = React.useState(location.state?.data || null);
  const [loading, setLoading] = React.useState(!data);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!data && rut) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}?rut=${encodeURIComponent(rut)}`);
          const result = await response.json();

          if (result.success) {
            const fetchedData = {
              nombre: result.data.nombre,
              rut: result.data.rut,
              observacion: result.data.observacion,
              location: result.data.juntaVecinos || "Not available",
              pickupLocation: result.data.direccionRetiro || "Not available",
              gifts: result.data.gifts || [],
            };

            fetchedData.nombre = fetchedData.nombre && fetchedData.nombre.toUpperCase() === fetchedData.nombre
              ? fetchedData.nombre.charAt(0).toUpperCase() + fetchedData.nombre.slice(1).toLowerCase()
              : fetchedData.nombre;

            setData(fetchedData);
          } else {
            setData(DUMMY_DATA);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setData(DUMMY_DATA);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [rut, data]);

  useEffect(() => {
    if (loading && !data) {
      navigate('/');
    }
  }, [loading, data, navigate]);

  if (loading || !data) {
    return (
      <Container>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <Typography variant="h5" sx={{ color: '#2196F3' }}>
            Loading results...
          </Typography>
        </Box>
      </Container>
    );
  }

  const giftObservations = data.gifts
    .filter(gift => (gift.status === 'red' || gift.status === 'blank') && gift.observacion)
    .map(gift => `${gift.name}: ${gift.observacion}`);

  const allObservations = [
    ...(data.observacion ? [data.observacion] : []),
    ...giftObservations
  ];

  const uniqueObservations = [...new Set(allObservations)];

  return (
    <Container maxWidth="lg">
      <Paper elevation={6} sx={{
        mt: 8,
        mb: 4,
        p: 4,
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)'
      }}>
        <Box mb={4} textAlign="center">
          <img
            src="https://placehold.co/1200x300/2196f3/ffffff?text=Gift+Distribution+Results"
            alt="Banner"
            style={{
              width: '100%',
              borderRadius: '12px',
              maxHeight: '200px',
              objectFit: 'cover'
            }}
          />
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            {[
              { label: 'Name', value: data.nombre },
              { label: 'RUT', value: data.rut },
              { label: 'Location', value: data.location },
              { label: 'Pickup Location', value: data.pickupLocation }
            ].map(({ label, value }) => (
              <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: '12px' }} key={label}>
                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                  {label}
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {value}
                </Typography>
              </Paper>
            ))}
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper elevation={3} sx={{
              p: 3,
              mb: 3,
              borderRadius: '12px',
              backgroundColor: data.gifts.some(gift => gift.status === 'red' || gift.status === 'blank') 
                ? 'rgba(255, 235, 238, 0.9)' 
                : 'white',
              border: data.gifts.some(gift => gift.status === 'red' || gift.status === 'blank')
                ? '1px solid rgba(255, 0, 0, 0.2)'
                : 'none'
            }}>
              <Typography variant="h6" fontWeight="bold" color="primary">
                Notes
              </Typography>
              {uniqueObservations.length > 0 ? (
                <Typography variant="body2" color="error" sx={{ mt: 2, whiteSpace: 'pre-line' }}>
                  {uniqueObservations.join('\n')}
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                  No notes available
                </Typography>
              )}
            </Paper>

            <Paper elevation={3} sx={{
              p: 3,
              borderRadius: '12px',
              background: 'linear-gradient(to right bottom, #ffffff, #f8f9fa)'
            }}>
              <Typography variant="h6" fontWeight="bold" color="primary" mb={3}>
                Gifts Status
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {data.gifts.map((gift, index) => (
                  <Paper key={`gift${index + 1}`} elevation={2} sx={{
                    p: 2,
                    borderRadius: '12px',
                    minWidth: '120px',
                    flex: '1 1 120px',
                    maxWidth: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)'
                    }
                  }}>
                    <Typography variant="subtitle2" textAlign="center" mb={2}>
                      {gift.name}
                    </Typography>

                    <img
                      src={`${process.env.PUBLIC_URL}/images/${gift.status === 'en evaluacion' ? 'black' : gift.status}.png`}
                      alt={`Gift ${gift.status}`}
                      onError={(e) => e.target.src = `${process.env.PUBLIC_URL}/images/default.png`}
                      style={{
                        width: '60px',
                        height: '60px',
                        marginBottom: '10px'
                      }}
                    />

                    <Typography variant="caption" sx={{
                      color: gift.status === 'green' ? '#2e7d32' :
                             gift.status === 'red' ? '#d32f2f' :
                             gift.status === 'black' ? '#000000' :
                             '#ed6c02',
                      fontWeight: 'bold'
                    }}>
                      {gift.status === 'green' ? 'Approved' :
                       gift.status === 'red' ? 'Rejected' :
                       gift.status === 'black' ? 'Under Review' :
                       'Approved with Notes'}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default App;
