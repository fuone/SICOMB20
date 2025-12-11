import React, { useState } from 'react';

import { FuelType, PaymentMethod, FuelApp } from './types';

export const FUEL_OPTIONS = Object.values(FuelType);
export const PAYMENT_OPTIONS = Object.values(PaymentMethod);
export const APP_OPTIONS = Object.values(FuelApp);

// This would ideally be an environment variable, but for this demo we set it here.
// The user needs to deploy the Google App Script and paste the URL here.
// export const GOOGLE_SCRIPT_URL = '';
export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzxT-g0rvy0HOBI8OvF_FY0FEGjAOdv4fa3MMtO9mV25dhTKa9hEHCTSSNItLMPc28w/exec'; 
export const GOOGLE_SCRIPT_URL_DEV = 'https://script.google.com/macros/s/AKfycbyNBfE_CvE9GpfZ9S8Z0gyqsPB-606MAe79oLX17uk/dev';

export const DEFAULT_USER = 'Anderson';
export const PROJ_NAME = 'SICOMB';
export const PROJ_VERSION = '2.0';
export const PROJ_DESCRIPTION = 'Sistema de Controle de Combustível';
export const PROJ_ICON = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="100%" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 16 16" xml:space="preserve" style="fill: var(--proj-icon-color);"><path d="M3,2.5C3,2.2,3.2,2,3.5,2h5C8.8,2,9,2.2,9,2.5v5C9,7.8,8.8,8,8.5,8h-5C3.2,8,3,7.8,3,7.5V2.5z"></path><path d="M1,2c0-1.1,0.9-2,2-2h6c1.1,0,2,0.9,2,2v8c1.1,0,2,0.9,2,2v0.5c0,0.3,0.2,0.5,0.5,0.5s0.5-0.2,0.5-0.5V8h-0.5  C13.2,8,13,7.8,13,7.5V4.4c0-0.3,0.2-0.5,0.5-0.5H15c0-0.5-0.1-0.9-0.2-1.2c-0.1-0.2-0.2-0.4-0.4-0.5C14.2,2.1,13.9,2,13.5,2  C13.2,2,13,1.8,13,1.5S13.2,1,13.5,1c0.6,0,1,0.1,1.4,0.3c0.4,0.2,0.6,0.6,0.8,0.9C16,2.9,16,3.7,16,4.3v3.2C16,7.8,15.8,8,15.5,8  c0,0,0,0,0,0H15v4.5c0,0.8-0.7,1.5-1.5,1.5S12,13.3,12,12.5V12c0-0.6-0.4-1-1-1v4h0.5c0.3,0,0.5,0.2,0.5,0.5S11.8,16,11.5,16h-11  C0.2,16,0,15.8,0,15.5S0.2,15,0.5,15H1V2z M10,2c0-0.6-0.4-1-1-1H3C2.4,1,2,1.4,2,2v13h8V2z"></path></svg>`;
