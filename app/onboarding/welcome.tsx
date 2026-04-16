import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import tw from '../../lib/tw';
import { COLORS } from '../../lib/constants';

const { width, height } = Dimensions.get('window');

const CAROUSEL_IMAGES = [
  require('../../assets/carousel_image.jpg'),
  require('../../assets/1.jpg'),
  require('../../assets/2.jpg'),
  require('../../assets/3.jpg'),
  require('../../assets/4.jpg'),
  require('../../assets/5.jpg'),
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  useEffect(() => {
    let timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % CAROUSEL_IMAGES.length;
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    }, 3000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <StatusBar style="dark" />
      <View style={tw`flex-1 justify-between pb-8`}>
        {/* Top Image Section (Swipeable Carousel) */}
        <View style={tw`pt-10`}>
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {CAROUSEL_IMAGES.map((img, index) => (
              <View key={index} style={[{ width }, tw`items-center justify-center`]}>
                <Image
                  source={img}
                  style={[tw`w-full`, { height: height * 0.45 }]}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Text content */}
        <View style={tw`px-8 items-center`}>
          <Text style={tw`text-2xl font-extrabold text-center text-slate-900 mb-4`}>
            Manage your finances {'\n'} with ease
          </Text>
          <Text style={tw`text-base text-slate-500 text-center leading-relaxed mb-6 px-2`}>
            Empower your financial journey with simple, intuitive tools. Track expenses, monitor income, and achieve your goals with confidence.
          </Text>

          {/* Carousel dots indicator */}
          <View style={tw`flex-row justify-center items-center mb-8 gap-2`}>
            {CAROUSEL_IMAGES.map((_, index) => (
              <View
                key={index}
                style={[
                  tw`w-2 h-2 rounded-full`,
                  activeIndex === index ? tw`bg-[#16A34A]` : tw`bg-slate-200`
                ]}
              />
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={tw`px-6 w-full gap-4`}>
          <TouchableOpacity
            style={tw`w-full bg-[#16A34A] py-4 rounded-xl shadow-sm`}
            activeOpacity={0.8}
            onPress={() => {
              // For now just route to index, handles not-implemented
              router.replace('/');
            }}
          >
            <Text style={tw`text-center text-white font-bold text-lg`}>Log in</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={tw`w-full bg-[#F3F4F6] py-4 rounded-xl`}
            activeOpacity={0.8}
            onPress={() => router.push('/onboarding/profile')}
          >
            <Text style={tw`text-center text-slate-900 font-bold text-lg`}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
