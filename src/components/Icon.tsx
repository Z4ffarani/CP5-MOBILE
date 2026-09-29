import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../theme/colors';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
};

export function Icon({ name, size = 22, color = colors.text }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
