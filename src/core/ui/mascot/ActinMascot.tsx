import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { palette, colors } from '@core/theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

type ActinMascotProps = {
  /** Ancho/alto del personaje en dp (es cuadrado). */
  size?: number;
  /** Respiración y parpadeo en bucle. Desactívalo si luego lo reemplazas por un Lottie. */
  animated?: boolean;
};

/**
 * "Actín": mascota de ActaYa — un acta (documento de escrutinio) con cara,
 * que sostiene un lápiz y lleva un sello de verificación. Pensado como base
 * visual para convertirlo luego en un avatar animado (Lottie o Reanimated):
 * cada parte (ojos, párpados, brazos, sello) está en su propio <G>/elemento
 * para poder animarla por separado en vez de redibujar todo el SVG.
 */
export function ActinMascot({ size = 160, animated = true }: ActinMascotProps) {
  const breath = useSharedValue(1);
  const blink = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;

    breath.value = 0;
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400 }),
        withTiming(0, { duration: 1400 }),
      ),
      -1,
      true,
    );

    blink.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2600 }),
        withTiming(1, { duration: 90 }),
        withTiming(1, { duration: 90 }),
        withTiming(0, { duration: 90 }),
      ),
      -1,
      false,
    );
  }, [animated, breath, blink]);

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.value * 0.03 }, { translateY: -breath.value * 2 }],
  }));

  const eyelidProps = useAnimatedProps(() => ({ opacity: blink.value }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.full, animated && bodyStyle]}>
        <Svg viewBox="0 0 200 220" width="100%" height="100%">
          {/* Cuerpo: el acta/documento */}
          <G>
            <Rect
              x={45}
              y={55}
              width={110}
              height={130}
              rx={16}
              fill={palette.blanco}
              stroke={palette.azul}
              strokeWidth={4}
            />
            {/* Esquina doblada, como una hoja de papel */}
            <Polygon points="155,55 155,80 130,55" fill={palette.amarillo} />
            {/* Clip del acta */}
            <Rect x={82} y={38} width={36} height={22} rx={8} fill={palette.rojo} />
          </G>

          {/* Líneas de texto del acta */}
          <G opacity={0.9}>
            <Rect x={65} y={150} width={70} height={6} rx={3} fill={palette.gris} />
            <Rect x={65} y={162} width={50} height={6} rx={3} fill={palette.gris} />
          </G>

          {/* Brazos */}
          <G fill={palette.azul}>
            <Rect
              x={20}
              y={118}
              width={14}
              height={54}
              rx={7}
              transform="rotate(-24 27 118)"
            />
            <Circle cx={13} cy={168} r={10} />
            <Rect
              x={166}
              y={118}
              width={14}
              height={54}
              rx={7}
              transform="rotate(24 173 118)"
            />
            <Circle cx={187} cy={168} r={10} />
          </G>

          {/* Lápiz en la mano derecha */}
          <G transform="rotate(-45 187 150)">
            <Rect x={181} y={122} width={12} height={34} rx={3} fill={palette.amarillo} />
            <Polygon points="181,122 193,122 187,110" fill={palette.negro} />
          </G>

          {/* Cara */}
          <G>
            <Circle cx={68} cy={128} r={7} fill={palette.crema} opacity={0.9} />
            <Circle cx={132} cy={128} r={7} fill={palette.crema} opacity={0.9} />

            <Circle cx={78} cy={110} r={9} fill={palette.negro} />
            <Circle cx={122} cy={110} r={9} fill={palette.negro} />

            {/* Párpados: se animan con `blink` para el parpadeo */}
            <AnimatedRect
              x={68}
              y={100}
              width={20}
              height={20}
              fill={palette.blanco}
              animatedProps={eyelidProps}
            />
            <AnimatedRect
              x={112}
              y={100}
              width={20}
              height={20}
              fill={palette.blanco}
              animatedProps={eyelidProps}
            />

            <Path
              d="M85 135 Q100 150 115 135"
              stroke={palette.negro}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
            />
          </G>

          {/* Piernas */}
          <G fill={palette.azul}>
            <Rect x={65} y={185} width={16} height={30} rx={8} />
            <Rect x={119} y={185} width={16} height={30} rx={8} />
          </G>
          <G fill={palette.negro}>
            <Ellipse cx={73} cy={218} rx={14} ry={7} />
            <Ellipse cx={127} cy={218} rx={14} ry={7} />
          </G>

          {/* Sello de acta verificada */}
          <G>
            <Circle cx={150} cy={172} r={18} fill={colors.success} stroke={palette.blanco} strokeWidth={3} />
            <Path
              d="M142 172 L148 178 L160 164"
              stroke={palette.blanco}
              strokeWidth={4}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  full: { width: '100%', height: '100%' },
});
