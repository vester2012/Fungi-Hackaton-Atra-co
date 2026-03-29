const DISTRIBUTION_DAMAGE = [
    [10, 1],
    [13, 1],
    [15, 1],
];

const rng = Math.random;



function pickWeighted(weights) {
    let total = 0;
    for (const [_, w] of weights) total += w;
    const r = rng() * total;
    let sum = 0;
    for (const [value, weight] of weights) {
        sum += weight;
        if (r < sum) return value;
    }
    return weights[weights.length - 1][0];
}

function getPlayerDamage() {
    return pickWeighted(DISTRIBUTION_DAMAGE);
}

module.exports = { getPlayerDamage };
