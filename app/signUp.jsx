import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from '../assets/icons';
import BackButton from '../components/BackButton';
import Button from '../components/Button';
import Input from '../components/Input';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import { hp, wp } from '../helpers/common';
import { supabase } from '../lib/supabase';

const SignUp = () =>{
    const router = useRouter();
    const emailRef = useRef("");
    const nameRef = useRef("");
    const passwordRef = useRef("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async () =>{
        if(!emailRef.current || !passwordRef.current){
            Alert.alert('Sign Up', "Please fill in all field!");
            return;
        }
        
        let name = nameRef.current.trim();
        let email = emailRef.current.trim();
        let password = passwordRef.current.trim();

        setLoading(true);

        const {data: {session}, error} = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { 
                    name 
                }
            }
        });

        setLoading(false);

        if(error){
            Alert.alert('Sign Up', error.message);
        }
    }

    return(
        <ScreenWrapper bg="white">
            <StatusBar style="dark" />
            <View style={styles.container}>
                <BackButton router={router}/>

                {/* welcome text */}
                <View>
                    <Text style={styles.WelcomeText}>Let's</Text>
                    <Text style={styles.WelcomeText}>Get Started</Text>
                </View>

                {/* form */}
                <View style={styles.form}>
                    <Text style={{fontSize: hp(1.5), color: theme.colors.text}}>
                        Please fill in the details to create an account
                    </Text>
                    <Input
                        icon={<Icon name="user" size={26} strokeWidth={1.6}/>}
                        placeholder="Enter your name"
                        onChangeText={value=> nameRef.current = value}
                    />
                    <Input
                        icon={<Icon name="mail" size={26} strokeWidth={1.6}/>}
                        placeholder="Enter your email"
                        onChangeText={value=> emailRef.current = value}
                    />
                    <Input
                        icon={<Icon name="lock" size={26} strokeWidth={1.6}/>}
                        placeholder="Enter your password"
                        secureTextEntry
                        onChangeText={value=> passwordRef.current = value}
                    />

                    {/* button */}
                    <Button
                        title="Sign up"
                        loading={loading}
                        onPress={onSubmit}
                    />

                    {/* footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Already have an account?
                        </Text>
                        <Pressable onPress={()=>router.push('login')}>
                            <Text style={[styles.footerText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semiBold}]}>
                                Log In
                            </Text>
                        </Pressable>         
                    </View>
                </View>
            </View>
        </ScreenWrapper>
    )
}

export default SignUp;

const styles = StyleSheet.create({
    container: {
        flex:1,
        gap: 45,
        paddingHorizontal: wp(5),
    },
    WelcomeText:{
        fontSize: hp(4),
        fontWeight: theme.fonts.Bold,
        color: theme.colors.text,
    },
    form:{
        gap:25,
    },
    forgotPassword:{
        textAlign: 'right',
        fontWeight: theme.fonts.semiBold,
        color: theme.colors.text,
    },
    footer:{
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
    },
    footerText:{
        color: theme.colors.text,
        fontSize: hp(1.6),
        textAlign: 'center',
    },
});