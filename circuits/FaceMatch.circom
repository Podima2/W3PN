pragma circom 2.0.0;

include "circuits/comparators.circom";

template FaceMatch(n, threshold) {
    signal input embedding1[n];
    signal input embedding2[n];
    signal output isMatch;

    signal diff[n];
    signal sqDiff[n];
    signal sum;

    for (var i = 0; i < n; i++) {
        diff[i] <== embedding1[i] - embedding2[i];
        sqDiff[i] <== diff[i] * diff[i];
    }

    // Accumulate sum using a second loop
    signal acc[n];
    acc[0] <== sqDiff[0];
    for (var i = 1; i < n; i++) {
        acc[i] <== acc[i - 1] + sqDiff[i];
    }

    sum <== acc[n - 1];

    component cmp = LessThan(32);
    cmp.in[0] <== sum;
    cmp.in[1] <== threshold;
    isMatch <== cmp.out;
}

component main = FaceMatch(128, 1000000);
