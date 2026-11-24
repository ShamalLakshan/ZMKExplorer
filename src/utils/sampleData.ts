// Generic sample keymaps and physical layouts for ZMK Explorer

export const SAMPLE_34_KEYMAP = `#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>

#define BASE 0
#define NUM  1
#define SYM  2

/ {
    combos {
        compatible = "zmk,combos";
        combo_tab {
            bindings = <&kp TAB>;
            key-positions = <0 1>;
            layers = <0 1 2>;
        };
        combo_enter {
            bindings = <&kp ENTER>;
            key-positions = <18 19>;
            layers = <0 1 2>;
        };
        combo_bksp {
            bindings = <&kp BACKSPACE>;
            key-positions = <8 9>;
            layers = <0 1 2>;
        };
        combo_esc {
            bindings = <&kp ESCAPE>;
            key-positions = <0 2>;
            layers = <0 1 2>;
        };
    };

    keymap {
        compatible = "zmk,keymap";

        base_layer {
            display-name = "Base";
            bindings = <
&kp Q  &kp W  &kp E  &kp R  &kp T    &kp Y  &kp U  &kp I      &kp O    &kp P
&kp A  &kp S  &kp D  &kp F  &kp G    &kp H  &kp J  &kp K      &kp L    &kp SEMI
&kp Z  &kp X  &kp C  &kp V  &kp B    &kp N  &kp M  &kp COMMA  &kp DOT  &kp FSLH
              &mo NUM  &kp SPACE     &kp ENTER  &mo SYM
            >;
        };

        num_layer {
            display-name = "Numbers";
            bindings = <
&kp N1  &kp N2  &kp N3  &kp N4  &kp N5    &kp N6  &kp N7  &kp N8  &kp N9  &kp N0
&kp TAB &kp PLUS &kp MINUS &kp EQUAL &kp UNDERSCORE &kp LEFT &kp DOWN &kp UP &kp RIGHT &kp ENTER
&kp LALT &kp GRAVE &kp TILDE &kp PIPE &kp BSLH &kp HOME &kp PG_DN &kp PG_UP &kp END &kp DEL
                &trans  &trans            &trans  &trans
            >;
        };

        sym_layer {
            display-name = "Symbols";
            bindings = <
&kp EXCL &kp AT &kp HASH &kp DLLR &kp PRCNT  &kp CARET &kp AMPS &kp ASTRK &kp LPAR &kp RPAR
&kp LBRC &kp RBRC &kp LBKT &kp RBKT &kp SQT   &kp DQT   &kp MINUS &kp PLUS  &kp COLON &kp QMARK
&trans   &trans   &trans   &trans   &trans    &trans    &trans    &trans    &trans    &trans
                  &trans   &trans             &trans    &trans
            >;
        };
    };
};`;

export const SAMPLE_36_KEYMAP = `#include <behaviors.dtsi>
#include <dt-bindings/zmk/keys.h>
#include <dt-bindings/zmk/bt.h>

#define BASE  0
#define LOWER 1
#define RAISE 2
#define NAV   3

/ {
    conditional_layers {
        compatible = "zmk,conditional-layers";
        tri_layer {
            if-layers = <LOWER RAISE>;
            then-layer = <NAV>;
        };
    };

    combos {
        compatible = "zmk,combos";
        combo_tab {
            bindings = <&kp TAB>;
            key-positions = <0 1>;
            layers = <0 1 2 3>;
        };
        combo_bksp {
            bindings = <&kp BACKSPACE>;
            key-positions = <8 9>;
            layers = <0 1 2 3>;
        };
        combo_enter {
            bindings = <&kp ENTER>;
            key-positions = <18 19>;
            layers = <0 1 2 3>;
        };
        combo_esc {
            bindings = <&kp ESCAPE>;
            key-positions = <10 11>;
            layers = <0 1 2 3>;
        };
    };

    keymap {
        compatible = "zmk,keymap";

        base_layer {
            display-name = "Base";
            bindings = <
&kp Q  &kp W  &kp E  &kp R  &kp T    &kp Y  &kp U  &kp I      &kp O    &kp P
&kp A  &kp S  &kp D  &kp F  &kp G    &kp H  &kp J  &kp K      &kp L    &kp SEMI
&kp Z  &kp X  &kp C  &kp V  &kp B    &kp N  &kp M  &kp COMMA  &kp DOT  &kp FSLH
        &kp LCTRL  &mo LOWER  &kp SPACE  &kp ENTER  &mo RAISE  &kp RGUI
            >;
        };

        lower_layer {
            display-name = "Lower";
            bindings = <
&kp EXCL  &kp AT    &kp HASH  &kp DLLR  &kp PRCNT   &kp CARET  &kp AMPS  &kp ASTRK  &kp LPAR  &kp RPAR
&kp TAB   &kp PLUS  &kp MINUS &kp EQUAL &kp UNDER   &kp LBKT   &kp RBKT  &kp LBRC   &kp RBRC  &kp BSLH
&kp LALT  &kp GRAVE &kp TILDE &kp PIPE  &kp COLON   &kp SQT    &kp DQT   &kp COMMA  &kp DOT   &kp SLASH
                    &trans    &trans    &trans      &trans     &trans    &trans
            >;
        };

        raise_layer {
            display-name = "Raise";
            bindings = <
&kp N1    &kp N2    &kp N3    &kp N4    &kp N5      &kp N6    &kp N7    &kp N8    &kp N9    &kp N0
&kp TAB   &kp F1    &kp F2    &kp F3    &kp F4      &kp LEFT  &kp DOWN  &kp UP    &kp RIGHT &kp DEL
&kp LALT  &kp F5    &kp F6    &kp F7    &kp F8      &kp HOME  &kp PG_DN &kp PG_UP &kp END   &kp ENTER
                    &trans    &trans    &trans      &trans    &trans    &trans
            >;
        };

        nav_layer {
            display-name = "Adjust";
            bindings = <
&bt BT_SEL 0 &bt BT_SEL 1 &bt BT_SEL 2 &bt BT_CLR &none   &none &none &none &none &bootloader
&none        &none        &none        &none      &none   &kp LEFT &kp DOWN &kp UP &kp RIGHT &sys_reset
&none        &none        &none        &none      &none   &none &none &none &none &none
                          &trans       &trans     &trans  &trans &trans &trans
            >;
        };
    };
};`;
