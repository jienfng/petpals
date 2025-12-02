import { useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import Button from '../components/Button'
import ScreenWrapper from '../components/ScreenWrapper'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'

const Welcome = () => {
    const router = useRouter()
    return (
    <ScreenWrapper bg="white">
        <StatusBar style="dark"/>
        <View style={styles.container}>
            {/* welcome image */}
            <Image style={styles.welcomeImage} source={require('../assets/images/welcome.png')} resizeMode='contain'/>
       
            {/* title */}
            <View style={{gap:20}}>
                <Text style={styles.title}>PetPals!</Text>
                <Text style={styles.punchLine}>
                    Where no pets get left behind.
                    </Text>
            </View>

            {/* footer */}
            <View style={styles.footer}>
                <Button 
                title="Get Started"
                buttonStyle={{marginHorizontal: wp(3)}}
                onPress={()=>router.push('signUp')} 
                />
                <View style={styles.bottomTextContainer}>
                    <Text style={styles.loginText}>
                        Already have an account? 
                    </Text>
                    <Pressable onPress={()=>router.push('login')}>
                        <Text style={[styles.loginText, {color: theme.colors.primaryDark, fontWeight: theme.fonts.semiBold}]}> 
                            Log In
                        </Text>
                    </Pressable>
                </View>
            </View>
        </View>
    </ScreenWrapper>
  )
}

import { useEffect } from "react"

useEffect(() => {
  (async () => {
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      console.log("ipify status:", r.status);
      console.log("ipify json:", await r.json());
    } catch (e) {
      console.log("Connectivity test failed:", e?.message);
    }
  })();
}, []);


export default Welcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-around',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: wp(4)
    },
    welcomeImage: {
        width: wp(100),
        height: hp(30),
        alignSelf: 'center'
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(4),
        textAlign: 'center',
        fontWeight: theme.fonts.extraBold
    },
    punchLine: {
        textAlign: 'center',
        paddingHorizontal: wp(10),
        fontSize: hp(1.7),
        color: theme.colors.text,
    },
    footer: {
        gap: 30,
        width: '100%',
    },
    bottomTextContainer: {  
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5
    },
    loginText: {
        color: theme.colors.text,
        textAlign: 'center',
        fontSize: hp(1.6),
    }   
})