// components/Input.jsx
import { StyleSheet, TextInput, View } from 'react-native';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';

const Input = ({
  icon,
  containerStyle,
  inputStyle,
  inputRef,
  ...props // onChangeText, placeholder, secureTextEntry, value, etc.
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}

      <TextInput
        ref={inputRef}    
        style={[styles.input, inputStyle]}
        placeholderTextColor={theme.colors.textLight}
        {...props}
      />
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(7.2),
    alignItems: 'center',
    borderWidth: 0.4,
    borderColor: theme.colors.text,
    borderRadius: theme.radius.xxl,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    gap: 12,
  },
  icon: {
    marginRight: 4,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: hp(1.9),
  },
});
