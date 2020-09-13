import React from 'react';
import {
    View,
    PanResponder,
    Animated,
    Image,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

const ClipRect = require('@remobile/react-native-clip-rect');
const flip_horizontally = require('./img/flip_horizontally.png');
const flip_vertically = require('./img/flip_vertically.png');
const rotate_left = require('./img/rotate_left.png');
const rotate_right = require('./img/rotate_right.png');
const reset = require('./img/reset.png');

module.exports = React.createClass({
    getDefaultProps () {
        return {
            editRectWidth: 212,
            editRectHeight: 212,
            editRectRadius: 106,
            overlayColor: 'rgba(0, 0, 0, 0.5)',
        };
    },
    componentWillMount () {
        const { editRectWidth, editRectHeight, imageWidth, imageHeight } = this.props;
        // 上次/当前/动画 x 位移
        this.lastGestureDx = null;
        this.translateX = 0;
        this.animatedTranslateX = new Animated.Value(this.translateX);

        // 上次/当前/动画 y 位移
        this.lastGestureDy = null;
        this.translateY = 0;
        this.animatedTranslateY = new Animated.Value(this.translateY);

        // 缩放大小
        this.scale = 1;
        this.animatedScale = new Animated.Value(this.scale);
        this.lastZoomDistance = null;
        this.currentZoomDistance = 0;

        // 旋转
        this.rotate = 0;
        this.animatedRotate = new Animated.Value(this.rotate);

        // 颠倒
        this.flipH = 0;
        this.animatedFlipH = new Animated.Value(this.flipH);
        this.flipV = 0;
        this.animatedFlipV = new Animated.Value(this.flipV);

        // 图片大小
        if (imageWidth < imageHeight) {
            this.imageMinWidth = editRectWidth;
            this.imageMinHeight = imageHeight / imageWidth * editRectHeight;
        } else {
            this.imageMinWidth = imageWidth / imageHeight * editRectWidth;
            this.imageMinHeight = editRectHeight;
        }
        this.imageMinSize = Math.floor(Math.sqrt(this.imageMinWidth * this.imageMinWidth + this.imageMinHeight * this.imageMinHeight));

        this.imagePanResponder = PanResponder.create({
            onStartShouldSetPanResponder: (evt, gestureState) => true,
            onStartShouldSetPanResponderCapture: (evt, gestureState) => true,
            onMoveShouldSetPanResponder: (evt, gestureState) => true,
            onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
            onPanResponderTerminationRequest: (evt, gestureState) => false,

            onPanResponderGrant: (evt, gestureState) => {
                this.lastGestureDx = null;
                this.lastGestureDy = null;
                this.lastZoomDistance = null;
            },
            onPanResponderMove: (evt, gestureState) => {
                const { changedTouches } = evt.nativeEvent;
                if (changedTouches.length <= 1) {
                    this.translateX += (this.lastGestureDx === null) ? 0 : gestureState.dx - this.lastGestureDx;
                    this.translateY += (this.lastGestureDy === null) ? 0 : gestureState.dy - this.lastGestureDy;
                    this.lastGestureDx = gestureState.dx;
                    this.lastGestureDy = gestureState.dy;
                    this.updateTranslate();
                } else {
                    const widthDistance = changedTouches[1].pageX - changedTouches[0].pageX;
                    const heightDistance = changedTouches[1].pageY - changedTouches[0].pageY;
                    this.currentZoomDistance = Math.floor(Math.sqrt(widthDistance * widthDistance + heightDistance * heightDistance));

                    if (this.lastZoomDistance !== null) {
                        let scale = this.scale + (this.currentZoomDistance - this.lastZoomDistance) * this.scale / this.imageMinSize;
                        if (scale < 1) {
                            scale = 1;
                        }
                        this.animatedScale.setValue(scale);
                        this.updateTranslate();
                        this.scale = scale;
                    }
                    this.lastZoomDistance = this.currentZoomDistance;
                }
            },
            onPanResponderRelease: (evt, gestureState) => {},
            onPanResponderTerminate: (evt, gestureState) => {},
        });
    },
    updateTranslate () {
        const { editRectWidth, editRectHeight } = this.props;
        if (this.rotate !== 90 && this.rotate !== 270) {
            const xOffest = (this.imageMinWidth - editRectWidth / this.scale) / 2;
            const yOffest = (this.imageMinHeight - editRectHeight / this.scale) / 2;

            if (this.translateX > xOffest) {
                this.translateX = xOffest;
            }
            if (this.translateX < -xOffest) {
                this.translateX = -xOffest;
            }
            if (this.translateY > yOffest) {
                this.translateY = yOffest;
            }
            if (this.translateY < -yOffest) {
                this.translateY = -yOffest;
            }
            this.animatedTranslateX.setValue(this.translateX);
            this.animatedTranslateY.setValue(this.translateY);
        } else {
            const xOffest = (this.imageMinWidth - editRectWidth / this.scale) / 2;
            const yOffest = (this.imageMinHeight - editRectHeight / this.scale) / 2;

            if (this.translateX > yOffest) {
                this.translateX = yOffest;
            }
            if (this.translateX < -yOffest) {
                this.translateX = -yOffest;
            }
            if (this.translateY > xOffest) {
                this.translateY = xOffest;
            }
            if (this.translateY < -xOffest) {
                this.translateY = -xOffest;
            }
            this.animatedTranslateX.setValue(this.translateY);
            this.animatedTranslateY.setValue(this.translateX);
        }
    },
    getCropData () {
        const { editRectWidth, editRectHeight, imageWidth, imageHeight } = this.props;
        const ratioX = imageWidth / this.imageMinWidth;
        const ratioY = imageHeight / this.imageMinHeight;
        const width = editRectWidth / this.scale;
        const height = editRectHeight / this.scale;
        const x = this.imageMinWidth / 2 - (width / 2 + this.translateX);
        const y = this.imageMinHeight / 2 - (height / 2 + this.translateY);
        return {
            offset: { x: x * ratioX, y: y * ratioY },
            size: { width: width * ratioX, height: height * ratioY },
            rotate: this.rotate,
            flipV: this.flipV,
            flipH: this.flipH,
        };
    },
    doRotate (isLeft) {
        if (isLeft) {
            if (this.rotate === 0) {
                this.rotate = 360;
            }
            this.rotate -= 90;
        } else {
            this.rotate += 90;
            if (this.rotate === 360) {
                this.rotate = 0;
            }
        }
        this.animatedRotate.setValue(this.rotate);
    },
    doFlip (isVertical) {
        if (isVertical) {
            this.flipV = this.flipV ^ 1;
            this.animatedFlipV.setValue(this.flipV);
        } else {
            this.flipH = this.flipH ^ 1;
            this.animatedFlipH.setValue(this.flipH);
        }
    },
    doReset () {
        this.rotate = 0;
        this.animatedRotate.setValue(this.rotate);

        this.flipV = 0;
        this.animatedFlipV.setValue(this.flipV);

        this.flipH = 0;
        this.animatedFlipH.setValue(this.flipH);

        this.translateX = 0;
        this.animatedTranslateX.setValue(this.translateX);

        this.translateY = 0;
        this.animatedTranslateY.setValue(this.translateY);

        this.scale = 1;
        this.animatedScale.setValue(this.scale);
        this.lastZoomDistance = null;
        this.currentZoomDistance = 0;
    },
    render () {
        const animatedStyle = {
            transform: [{
                scale: this.animatedScale,
            }, {
                rotateZ: this.animatedRotate.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }),
            }, {
                rotateX: this.animatedFlipV.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
            }, {
                rotateY: this.animatedFlipH.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }),
            }, {
                translateX: this.animatedTranslateX,
            }, {
                translateY: this.animatedTranslateY,
            }],
        };
        const { editRectWidth, editRectHeight, editRectRadius, source, style, overlayColor } = this.props;
        return (
            <View style={{ flex: 1 }}>
                <View style={[styles.container, style]} {...this.imagePanResponder.panHandlers}>
                    <Animated.View style={animatedStyle}>
                        <Image resizeMode='contain' style={{ width: this.imageMinWidth, height: this.imageMinHeight }} source={source} />
                    </Animated.View>
                    <View style={styles.editboxContainer}>
                        <View style={{ flex: 1, backgroundColor: overlayColor }} />
                        <View style={styles.editboxMiddle} >
                            <View style={{ flex: 1, backgroundColor: overlayColor }} />
                            <View style={{ width: editRectWidth, height: editRectHeight }} >
                                <ClipRect style={{ width: editRectWidth, height: editRectHeight, borderRadius: editRectRadius, color: overlayColor }} />
                                <View style={[styles.clipRectBoder, { borderRadius: editRectRadius }]} />
                            </View>
                            <View style={{ flex: 1, backgroundColor: overlayColor }} />
                        </View>
                        <View style={{ flex: 1, backgroundColor: overlayColor }} />
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity onPress={this.doRotate.bind(null, 0)} style={styles.buttonOuter}>
                        <Image source={rotate_right} style={styles.button} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.doRotate.bind(null, 1)} style={styles.buttonOuter}>
                        <Image source={rotate_left} style={styles.button} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.doFlip.bind(null, 0)} style={styles.buttonOuter}>
                        <Image source={flip_vertically} style={styles.button} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.doFlip.bind(null, 1)} style={styles.buttonOuter}>
                        <Image source={flip_horizontally} style={styles.button} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={this.doReset} style={styles.buttonOuter}>
                        <Image source={reset} style={styles.button} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        backgroundColor: 'black',
    },
    editboxContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    },
    clipRectBoder: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        borderColor: '#FFFFFF',
        borderWidth: 2,
    },
    editboxMiddle: {
        flexDirection: 'row',
    },
    buttonContainer: {
        position: 'absolute',
        height: 40,
        width: sr.w,
        paddingLeft: (sr.w - 250) / 2,
        left: 0,
        top: 0,
        alignItems: 'center',
        flexDirection: 'row',
    },
    buttonOuter: {
        width: 30,
        height: 30,
        marginLeft: 10,
        marginRight: 10,
        marginTop: 10,
        borderRadius: 15,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    button: {
        width: 25,
        height: 25,
    },
});
