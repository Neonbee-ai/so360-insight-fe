import React from 'react';
export const Button = ({ children, ...props }: any) => React.createElement('button', props, children);
export const Input = ({ ...props }: any) => React.createElement('input', props);
export const Select = ({ children, ...props }: any) => React.createElement('select', props, children);
export const Modal = ({ children, ...props }: any) => React.createElement('div', props, children);
export const Card = ({ children, ...props }: any) => React.createElement('div', props, children);
export const Badge = ({ children, ...props }: any) => React.createElement('span', props, children);
export const Spinner = (props: any) => React.createElement('div', props);
export const Tooltip = ({ children, ...props }: any) => React.createElement('div', props, children);
