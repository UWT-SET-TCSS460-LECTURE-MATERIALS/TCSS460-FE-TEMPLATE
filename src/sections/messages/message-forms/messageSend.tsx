'use client';

import React from 'react';

// next

// material-ui
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project import
import AnimateButton from 'components/@extended/AnimateButton';

import { messagesApi } from 'services/messagesApi';

export default function SendMessage({
  priority,
  onSuccess,
  onError
}: {
  priority: number;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  return (
    <Formik
      initialValues={{
        sender: '',
        message: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        sender: Yup.string().max(255).required('Name is required'),
        message: Yup.string().max(255).required('Message is required')
      })}
      onSubmit={(values, { setErrors, setSubmitting, setValues, resetForm }) => {
        messagesApi
          .create({ name: values.sender, message: values.message, priority })
          .then((response) => {
            setSubmitting(false);
            resetForm({
              values: {
                sender: '',
                message: '',
                submit: null
              }
            });
            onSuccess();
          })
          .catch((error) => {
            console.error(error);
            setErrors({ sender: error.message });
            setSubmitting(false);
            onError(error.message);
          });
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel htmlFor="sender">Sender&apos;s Name</InputLabel>
                <OutlinedInput
                  id="sender-name"
                  type="text"
                  value={values.sender}
                  name="sender"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Enter the sender's name"
                  fullWidth
                  error={Boolean(touched.sender && errors.sender)}
                />
              </Stack>
              {touched.sender && errors.sender && (
                <FormHelperText error id="standard-weight-helper-text-name-message-send">
                  {errors.sender}
                </FormHelperText>
              )}
            </Grid>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel htmlFor="message">Message</InputLabel>
                <OutlinedInput
                  fullWidth
                  error={Boolean(touched.message && errors.message)}
                  id="-sender-message"
                  type="text"
                  value={values.message}
                  name="message"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Enter a message"
                />
              </Stack>
              {touched.message && errors.message && (
                <FormHelperText error id="standard-weight-helper-text-msg-message-send">
                  {errors.message}
                </FormHelperText>
              )}
            </Grid>

            {errors.submit && (
              <Grid item xs={12}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Grid>
            )}
            <Grid item xs={12}>
              <AnimateButton>
                <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
                  SEND!
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
}
