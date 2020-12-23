var bigInt = function (undefined) {
    "use strict";
    var BASE = 1e7, LOG_BASE = 7, MAX_INT = 9007199254740992, MAX_INT_ARR = smallToArray(MAX_INT),
        LOG_MAX_INT = Math.log(MAX_INT);

    function Integer(v, radix) {
        if (typeof v === "undefined") return Integer[0];
        if (typeof radix !== "undefined") return +radix === 10 ? parseValue(v) : parseBase(v, radix);
        return parseValue(v)
    }

    function BigInteger(value, sign) {
        this.value = value;
        this.sign = sign;
        this.isSmall = false
    }

    BigInteger.prototype = Object.create(Integer.prototype);

    function SmallInteger(value) {
        this.value = value;
        this.sign = value < 0;
        this.isSmall = true
    }

    SmallInteger.prototype = Object.create(Integer.prototype);

    function isPrecise(n) {
        return -MAX_INT < n && n < MAX_INT
    }

    function smallToArray(n) {
        if (n < 1e7) return [n];
        if (n < 1e14) return [n % 1e7, Math.floor(n / 1e7)];
        return [n % 1e7, Math.floor(n / 1e7) % 1e7, Math.floor(n / 1e14)]
    }

    function arrayToSmall(arr) {
        trim(arr);
        var length = arr.length;
        if (length < 4 && compareAbs(arr, MAX_INT_ARR) < 0) {
            switch (length) {
                case 0:
                    return 0;
                case 1:
                    return arr[0];
                case 2:
                    return arr[0] + arr[1] * BASE;
                default:
                    return arr[0] + (arr[1] + arr[2] * BASE) * BASE
            }
        }
        return arr
    }

    function trim(v) {
        var i = v.length;
        while (v[--i] === 0) ;
        v.length = i + 1
    }

    function createArray(length) {
        var x = new Array(length);
        var i = -1;
        while (++i < length) {
            x[i] = 0
        }
        return x
    }

    function truncate(n) {
        if (n > 0) return Math.floor(n);
        return Math.ceil(n)
    }

    function add(a, b) {
        var l_a = a.length, l_b = b.length, r = new Array(l_a), carry = 0, base = BASE, sum, i;
        for (i = 0; i < l_b; i++) {
            sum = a[i] + b[i] + carry;
            carry = sum >= base ? 1 : 0;
            r[i] = sum - carry * base
        }
        while (i < l_a) {
            sum = a[i] + carry;
            carry = sum === base ? 1 : 0;
            r[i++] = sum - carry * base
        }
        if (carry > 0) r.push(carry);
        return r
    }

    function addAny(a, b) {
        if (a.length >= b.length) return add(a, b);
        return add(b, a)
    }

    function addSmall(a, carry) {
        var l = a.length, r = new Array(l), base = BASE, sum, i;
        for (i = 0; i < l; i++) {
            sum = a[i] - base + carry;
            carry = Math.floor(sum / base);
            r[i] = sum - carry * base;
            carry += 1
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base)
        }
        return r
    }

    BigInteger.prototype.add = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.subtract(n.negate())
        }
        var a = this.value, b = n.value;
        if (n.isSmall) {
            return new BigInteger(addSmall(a, Math.abs(b)), this.sign)
        }
        return new BigInteger(addAny(a, b), this.sign)
    };
    BigInteger.prototype.plus = BigInteger.prototype.add;
    SmallInteger.prototype.add = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.subtract(n.negate())
        }
        var b = n.value;
        if (n.isSmall) {
            if (isPrecise(a + b)) return new SmallInteger(a + b);
            b = smallToArray(Math.abs(b))
        }
        return new BigInteger(addSmall(b, Math.abs(a)), a < 0)
    };
    SmallInteger.prototype.plus = SmallInteger.prototype.add;

    function subtract(a, b) {
        var a_l = a.length, b_l = b.length, r = new Array(a_l), borrow = 0, base = BASE, i,
            difference;
        for (i = 0; i < b_l; i++) {
            difference = a[i] - borrow - b[i];
            if (difference < 0) {
                difference += base;
                borrow = 1
            } else borrow = 0;
            r[i] = difference
        }
        for (i = b_l; i < a_l; i++) {
            difference = a[i] - borrow;
            if (difference < 0) difference += base; else {
                r[i++] = difference;
                break
            }
            r[i] = difference
        }
        for (; i < a_l; i++) {
            r[i] = a[i]
        }
        trim(r);
        return r
    }

    function subtractAny(a, b, sign) {
        var value;
        if (compareAbs(a, b) >= 0) {
            value = subtract(a, b)
        } else {
            value = subtract(b, a);
            sign = !sign
        }
        value = arrayToSmall(value);
        if (typeof value === "number") {
            if (sign) value = -value;
            return new SmallInteger(value)
        }
        return new BigInteger(value, sign)
    }

    function subtractSmall(a, b, sign) {
        var l = a.length, r = new Array(l), carry = -b, base = BASE, i, difference;
        for (i = 0; i < l; i++) {
            difference = a[i] + carry;
            carry = Math.floor(difference / base);
            difference %= base;
            r[i] = difference < 0 ? difference + base : difference
        }
        r = arrayToSmall(r);
        if (typeof r === "number") {
            if (sign) r = -r;
            return new SmallInteger(r)
        }
        return new BigInteger(r, sign)
    }

    BigInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        if (this.sign !== n.sign) {
            return this.add(n.negate())
        }
        var a = this.value, b = n.value;
        if (n.isSmall) return subtractSmall(a, Math.abs(b), this.sign);
        return subtractAny(a, b, this.sign)
    };
    BigInteger.prototype.minus = BigInteger.prototype.subtract;
    SmallInteger.prototype.subtract = function (v) {
        var n = parseValue(v);
        var a = this.value;
        if (a < 0 !== n.sign) {
            return this.add(n.negate())
        }
        var b = n.value;
        if (n.isSmall) {
            return new SmallInteger(a - b)
        }
        return subtractSmall(b, Math.abs(a), a >= 0)
    };
    SmallInteger.prototype.minus = SmallInteger.prototype.subtract;
    BigInteger.prototype.negate = function () {
        return new BigInteger(this.value, !this.sign)
    };
    SmallInteger.prototype.negate = function () {
        var sign = this.sign;
        var small = new SmallInteger(-this.value);
        small.sign = !sign;
        return small
    };
    BigInteger.prototype.abs = function () {
        return new BigInteger(this.value, false)
    };
    SmallInteger.prototype.abs = function () {
        return new SmallInteger(Math.abs(this.value))
    };

    function multiplyLong(a, b) {
        var a_l = a.length, b_l = b.length, l = a_l + b_l, r = createArray(l), base = BASE, product,
            carry, i, a_i, b_j;
        for (i = 0; i < a_l; ++i) {
            a_i = a[i];
            for (var j = 0; j < b_l; ++j) {
                b_j = b[j];
                product = a_i * b_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry
            }
        }
        trim(r);
        return r
    }

    function multiplySmall(a, b) {
        var l = a.length, r = new Array(l), base = BASE, carry = 0, product, i;
        for (i = 0; i < l; i++) {
            product = a[i] * b + carry;
            carry = Math.floor(product / base);
            r[i] = product - carry * base
        }
        while (carry > 0) {
            r[i++] = carry % base;
            carry = Math.floor(carry / base)
        }
        return r
    }

    function shiftLeft(x, n) {
        var r = [];
        while (n-- > 0) r.push(0);
        return r.concat(x)
    }

    function multiplyKaratsuba(x, y) {
        var n = Math.max(x.length, y.length);
        if (n <= 30) return multiplyLong(x, y);
        n = Math.ceil(n / 2);
        var b = x.slice(n), a = x.slice(0, n), d = y.slice(n), c = y.slice(0, n);
        var ac = multiplyKaratsuba(a, c), bd = multiplyKaratsuba(b, d),
            abcd = multiplyKaratsuba(addAny(a, b), addAny(c, d));
        var product = addAny(addAny(ac, shiftLeft(subtract(subtract(abcd, ac), bd), n)), shiftLeft(bd, 2 * n));
        trim(product);
        return product
    }

    function useKaratsuba(l1, l2) {
        return -.012 * l1 - .012 * l2 + 15e-6 * l1 * l2 > 0
    }

    BigInteger.prototype.multiply = function (v) {
        var n = parseValue(v), a = this.value, b = n.value, sign = this.sign !== n.sign, abs;
        if (n.isSmall) {
            if (b === 0) return Integer[0];
            if (b === 1) return this;
            if (b === -1) return this.negate();
            abs = Math.abs(b);
            if (abs < BASE) {
                return new BigInteger(multiplySmall(a, abs), sign)
            }
            b = smallToArray(abs)
        }
        if (useKaratsuba(a.length, b.length)) return new BigInteger(multiplyKaratsuba(a, b), sign);
        return new BigInteger(multiplyLong(a, b), sign)
    };
    BigInteger.prototype.times = BigInteger.prototype.multiply;

    function multiplySmallAndArray(a, b, sign) {
        if (a < BASE) {
            return new BigInteger(multiplySmall(b, a), sign)
        }
        return new BigInteger(multiplyLong(b, smallToArray(a)), sign)
    }

    SmallInteger.prototype._multiplyBySmall = function (a) {
        if (isPrecise(a.value * this.value)) {
            return new SmallInteger(a.value * this.value)
        }
        return multiplySmallAndArray(Math.abs(a.value), smallToArray(Math.abs(this.value)), this.sign !== a.sign)
    };
    BigInteger.prototype._multiplyBySmall = function (a) {
        if (a.value === 0) return Integer[0];
        if (a.value === 1) return this;
        if (a.value === -1) return this.negate();
        return multiplySmallAndArray(Math.abs(a.value), this.value, this.sign !== a.sign)
    };
    SmallInteger.prototype.multiply = function (v) {
        return parseValue(v)._multiplyBySmall(this)
    };
    SmallInteger.prototype.times = SmallInteger.prototype.multiply;

    function square(a) {
        var l = a.length, r = createArray(l + l), base = BASE, product, carry, i, a_i, a_j;
        for (i = 0; i < l; i++) {
            a_i = a[i];
            for (var j = 0; j < l; j++) {
                a_j = a[j];
                product = a_i * a_j + r[i + j];
                carry = Math.floor(product / base);
                r[i + j] = product - carry * base;
                r[i + j + 1] += carry
            }
        }
        trim(r);
        return r
    }

    BigInteger.prototype.square = function () {
        return new BigInteger(square(this.value), false)
    };
    SmallInteger.prototype.square = function () {
        var value = this.value * this.value;
        if (isPrecise(value)) return new SmallInteger(value);
        return new BigInteger(square(smallToArray(Math.abs(this.value))), false)
    };

    function divMod1(a, b) {
        var a_l = a.length, b_l = b.length, base = BASE, result = createArray(b.length),
            divisorMostSignificantDigit = b[b_l - 1],
            lambda = Math.ceil(base / (2 * divisorMostSignificantDigit)),
            remainder = multiplySmall(a, lambda), divisor = multiplySmall(b, lambda), quotientDigit,
            shift, carry, borrow, i, l, q;
        if (remainder.length <= a_l) remainder.push(0);
        divisor.push(0);
        divisorMostSignificantDigit = divisor[b_l - 1];
        for (shift = a_l - b_l; shift >= 0; shift--) {
            quotientDigit = base - 1;
            if (remainder[shift + b_l] !== divisorMostSignificantDigit) {
                quotientDigit = Math.floor((remainder[shift + b_l] * base + remainder[shift + b_l - 1]) / divisorMostSignificantDigit)
            }
            carry = 0;
            borrow = 0;
            l = divisor.length;
            for (i = 0; i < l; i++) {
                carry += quotientDigit * divisor[i];
                q = Math.floor(carry / base);
                borrow += remainder[shift + i] - (carry - q * base);
                carry = q;
                if (borrow < 0) {
                    remainder[shift + i] = borrow + base;
                    borrow = -1
                } else {
                    remainder[shift + i] = borrow;
                    borrow = 0
                }
            }
            while (borrow !== 0) {
                quotientDigit -= 1;
                carry = 0;
                for (i = 0; i < l; i++) {
                    carry += remainder[shift + i] - base + divisor[i];
                    if (carry < 0) {
                        remainder[shift + i] = carry + base;
                        carry = 0
                    } else {
                        remainder[shift + i] = carry;
                        carry = 1
                    }
                }
                borrow += carry
            }
            result[shift] = quotientDigit
        }
        remainder = divModSmall(remainder, lambda)[0];
        return [arrayToSmall(result), arrayToSmall(remainder)]
    }

    function divMod2(a, b) {
        var a_l = a.length, b_l = b.length, result = [], part = [], base = BASE, guess, xlen, highx,
            highy, check;
        while (a_l) {
            part.unshift(a[--a_l]);
            trim(part);
            if (compareAbs(part, b) < 0) {
                result.push(0);
                continue
            }
            xlen = part.length;
            highx = part[xlen - 1] * base + part[xlen - 2];
            highy = b[b_l - 1] * base + b[b_l - 2];
            if (xlen > b_l) {
                highx = (highx + 1) * base
            }
            guess = Math.ceil(highx / highy);
            do {
                check = multiplySmall(b, guess);
                if (compareAbs(check, part) <= 0) break;
                guess--
            } while (guess);
            result.push(guess);
            part = subtract(part, check)
        }
        result.reverse();
        return [arrayToSmall(result), arrayToSmall(part)]
    }

    function divModSmall(value, lambda) {
        var length = value.length, quotient = createArray(length), base = BASE, i, q, remainder,
            divisor;
        remainder = 0;
        for (i = length - 1; i >= 0; --i) {
            divisor = remainder * base + value[i];
            q = truncate(divisor / lambda);
            remainder = divisor - q * lambda;
            quotient[i] = q | 0
        }
        return [quotient, remainder | 0]
    }

    function divModAny(self, v) {
        var value, n = parseValue(v);
        var a = self.value, b = n.value;
        var quotient;
        if (b === 0) throw new Error("Cannot divide by zero");
        if (self.isSmall) {
            if (n.isSmall) {
                return [new SmallInteger(truncate(a / b)), new SmallInteger(a % b)]
            }
            return [Integer[0], self]
        }
        if (n.isSmall) {
            if (b === 1) return [self, Integer[0]];
            if (b == -1) return [self.negate(), Integer[0]];
            var abs = Math.abs(b);
            if (abs < BASE) {
                value = divModSmall(a, abs);
                quotient = arrayToSmall(value[0]);
                var remainder = value[1];
                if (self.sign) remainder = -remainder;
                if (typeof quotient === "number") {
                    if (self.sign !== n.sign) quotient = -quotient;
                    return [new SmallInteger(quotient), new SmallInteger(remainder)]
                }
                return [new BigInteger(quotient, self.sign !== n.sign), new SmallInteger(remainder)]
            }
            b = smallToArray(abs)
        }
        var comparison = compareAbs(a, b);
        if (comparison === -1) return [Integer[0], self];
        if (comparison === 0) return [Integer[self.sign === n.sign ? 1 : -1], Integer[0]];
        if (a.length + b.length <= 200) value = divMod1(a, b); else value = divMod2(a, b);
        quotient = value[0];
        var qSign = self.sign !== n.sign, mod = value[1], mSign = self.sign;
        if (typeof quotient === "number") {
            if (qSign) quotient = -quotient;
            quotient = new SmallInteger(quotient)
        } else quotient = new BigInteger(quotient, qSign);
        if (typeof mod === "number") {
            if (mSign) mod = -mod;
            mod = new SmallInteger(mod)
        } else mod = new BigInteger(mod, mSign);
        return [quotient, mod]
    }

    BigInteger.prototype.divmod = function (v) {
        var result = divModAny(this, v);
        return {quotient: result[0], remainder: result[1]}
    };
    SmallInteger.prototype.divmod = BigInteger.prototype.divmod;
    BigInteger.prototype.divide = function (v) {
        return divModAny(this, v)[0]
    };
    SmallInteger.prototype.over = SmallInteger.prototype.divide = BigInteger.prototype.over = BigInteger.prototype.divide;
    BigInteger.prototype.mod = function (v) {
        return divModAny(this, v)[1]
    };
    SmallInteger.prototype.remainder = SmallInteger.prototype.mod = BigInteger.prototype.remainder = BigInteger.prototype.mod;
    BigInteger.prototype.pow = function (v) {
        var n = parseValue(v), a = this.value, b = n.value, value, x, y;
        if (b === 0) return Integer[1];
        if (a === 0) return Integer[0];
        if (a === 1) return Integer[1];
        if (a === -1) return n.isEven() ? Integer[1] : Integer[-1];
        if (n.sign) {
            return Integer[0]
        }
        if (!n.isSmall) throw new Error("The exponent " + n.toString() + " is too large.");
        if (this.isSmall) {
            if (isPrecise(value = Math.pow(a, b))) return new SmallInteger(truncate(value))
        }
        x = this;
        y = Integer[1];
        while (true) {
            if (b & 1 === 1) {
                y = y.times(x);
                --b
            }
            if (b === 0) break;
            b /= 2;
            x = x.square()
        }
        return y
    };
    SmallInteger.prototype.pow = BigInteger.prototype.pow;
    BigInteger.prototype.modPow = function (exp, mod) {
        exp = parseValue(exp);
        mod = parseValue(mod);
        if (mod.isZero()) throw new Error("Cannot take modPow with modulus 0");
        var r = Integer[1], base = this.mod(mod);
        while (exp.isPositive()) {
            if (base.isZero()) return Integer[0];
            if (exp.isOdd()) r = r.multiply(base).mod(mod);
            exp = exp.divide(2);
            base = base.square().mod(mod)
        }
        return r
    };
    SmallInteger.prototype.modPow = BigInteger.prototype.modPow;

    function compareAbs(a, b) {
        if (a.length !== b.length) {
            return a.length > b.length ? 1 : -1
        }
        for (var i = a.length - 1; i >= 0; i--) {
            if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1
        }
        return 0
    }

    BigInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v), a = this.value, b = n.value;
        if (n.isSmall) return 1;
        return compareAbs(a, b)
    };
    SmallInteger.prototype.compareAbs = function (v) {
        var n = parseValue(v), a = Math.abs(this.value), b = n.value;
        if (n.isSmall) {
            b = Math.abs(b);
            return a === b ? 0 : a > b ? 1 : -1
        }
        return -1
    };
    BigInteger.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1
        }
        if (v === -Infinity) {
            return 1
        }
        var n = parseValue(v), a = this.value, b = n.value;
        if (this.sign !== n.sign) {
            return n.sign ? 1 : -1
        }
        if (n.isSmall) {
            return this.sign ? -1 : 1
        }
        return compareAbs(a, b) * (this.sign ? -1 : 1)
    };
    BigInteger.prototype.compareTo = BigInteger.prototype.compare;
    SmallInteger.prototype.compare = function (v) {
        if (v === Infinity) {
            return -1
        }
        if (v === -Infinity) {
            return 1
        }
        var n = parseValue(v), a = this.value, b = n.value;
        if (n.isSmall) {
            return a == b ? 0 : a > b ? 1 : -1
        }
        if (a < 0 !== n.sign) {
            return a < 0 ? -1 : 1
        }
        return a < 0 ? 1 : -1
    };
    SmallInteger.prototype.compareTo = SmallInteger.prototype.compare;
    BigInteger.prototype.equals = function (v) {
        return this.compare(v) === 0
    };
    SmallInteger.prototype.eq = SmallInteger.prototype.equals = BigInteger.prototype.eq = BigInteger.prototype.equals;
    BigInteger.prototype.notEquals = function (v) {
        return this.compare(v) !== 0
    };
    SmallInteger.prototype.neq = SmallInteger.prototype.notEquals = BigInteger.prototype.neq = BigInteger.prototype.notEquals;
    BigInteger.prototype.greater = function (v) {
        return this.compare(v) > 0
    };
    SmallInteger.prototype.gt = SmallInteger.prototype.greater = BigInteger.prototype.gt = BigInteger.prototype.greater;
    BigInteger.prototype.lesser = function (v) {
        return this.compare(v) < 0
    };
    SmallInteger.prototype.lt = SmallInteger.prototype.lesser = BigInteger.prototype.lt = BigInteger.prototype.lesser;
    BigInteger.prototype.greaterOrEquals = function (v) {
        return this.compare(v) >= 0
    };
    SmallInteger.prototype.geq = SmallInteger.prototype.greaterOrEquals = BigInteger.prototype.geq = BigInteger.prototype.greaterOrEquals;
    BigInteger.prototype.lesserOrEquals = function (v) {
        return this.compare(v) <= 0
    };
    SmallInteger.prototype.leq = SmallInteger.prototype.lesserOrEquals = BigInteger.prototype.leq = BigInteger.prototype.lesserOrEquals;
    BigInteger.prototype.isEven = function () {
        return (this.value[0] & 1) === 0
    };
    SmallInteger.prototype.isEven = function () {
        return (this.value & 1) === 0
    };
    BigInteger.prototype.isOdd = function () {
        return (this.value[0] & 1) === 1
    };
    SmallInteger.prototype.isOdd = function () {
        return (this.value & 1) === 1
    };
    BigInteger.prototype.isPositive = function () {
        return !this.sign
    };
    SmallInteger.prototype.isPositive = function () {
        return this.value > 0
    };
    BigInteger.prototype.isNegative = function () {
        return this.sign
    };
    SmallInteger.prototype.isNegative = function () {
        return this.value < 0
    };
    BigInteger.prototype.isUnit = function () {
        return false
    };
    SmallInteger.prototype.isUnit = function () {
        return Math.abs(this.value) === 1
    };
    BigInteger.prototype.isZero = function () {
        return false
    };
    SmallInteger.prototype.isZero = function () {
        return this.value === 0
    };
    BigInteger.prototype.isDivisibleBy = function (v) {
        var n = parseValue(v);
        var value = n.value;
        if (value === 0) return false;
        if (value === 1) return true;
        if (value === 2) return this.isEven();
        return this.mod(n).equals(Integer[0])
    };
    SmallInteger.prototype.isDivisibleBy = BigInteger.prototype.isDivisibleBy;

    function isBasicPrime(v) {
        var n = v.abs();
        if (n.isUnit()) return false;
        if (n.equals(2) || n.equals(3) || n.equals(5)) return true;
        if (n.isEven() || n.isDivisibleBy(3) || n.isDivisibleBy(5)) return false;
        if (n.lesser(25)) return true
    }

    BigInteger.prototype.isPrime = function () {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs(), nPrev = n.prev();
        var a = [2, 3, 5, 7, 11, 13, 17, 19], b = nPrev, d, t, i, x;
        while (b.isEven()) b = b.divide(2);
        for (i = 0; i < a.length; i++) {
            x = bigInt(a[i]).modPow(b, n);
            if (x.equals(Integer[1]) || x.equals(nPrev)) continue;
            for (t = true, d = b; t && d.lesser(nPrev); d = d.multiply(2)) {
                x = x.square().mod(n);
                if (x.equals(nPrev)) t = false
            }
            if (t) return false
        }
        return true
    };
    SmallInteger.prototype.isPrime = BigInteger.prototype.isPrime;
    BigInteger.prototype.isProbablePrime = function (iterations) {
        var isPrime = isBasicPrime(this);
        if (isPrime !== undefined) return isPrime;
        var n = this.abs();
        var t = iterations === undefined ? 5 : iterations;
        for (var i = 0; i < t; i++) {
            var a = bigInt.randBetween(2, n.minus(2));
            if (!a.modPow(n.prev(), n).isUnit()) return false
        }
        return true
    };
    SmallInteger.prototype.isProbablePrime = BigInteger.prototype.isProbablePrime;
    BigInteger.prototype.modInv = function (n) {
        var t = bigInt.zero, newT = bigInt.one, r = parseValue(n), newR = this.abs(), q, lastT,
            lastR;
        while (!newR.equals(bigInt.zero)) {
            q = r.divide(newR);
            lastT = t;
            lastR = r;
            t = newT;
            r = newR;
            newT = lastT.subtract(q.multiply(newT));
            newR = lastR.subtract(q.multiply(newR))
        }
        if (!r.equals(1)) throw new Error(this.toString() + " and " + n.toString() + " are not co-prime");
        if (t.compare(0) === -1) {
            t = t.add(n)
        }
        if (this.isNegative()) {
            return t.negate()
        }
        return t
    };
    SmallInteger.prototype.modInv = BigInteger.prototype.modInv;
    BigInteger.prototype.next = function () {
        var value = this.value;
        if (this.sign) {
            return subtractSmall(value, 1, this.sign)
        }
        return new BigInteger(addSmall(value, 1), this.sign)
    };
    SmallInteger.prototype.next = function () {
        var value = this.value;
        if (value + 1 < MAX_INT) return new SmallInteger(value + 1);
        return new BigInteger(MAX_INT_ARR, false)
    };
    BigInteger.prototype.prev = function () {
        var value = this.value;
        if (this.sign) {
            return new BigInteger(addSmall(value, 1), true)
        }
        return subtractSmall(value, 1, this.sign)
    };
    SmallInteger.prototype.prev = function () {
        var value = this.value;
        if (value - 1 > -MAX_INT) return new SmallInteger(value - 1);
        return new BigInteger(MAX_INT_ARR, true)
    };
    var powersOfTwo = [1];
    while (2 * powersOfTwo[powersOfTwo.length - 1] <= BASE) powersOfTwo.push(2 * powersOfTwo[powersOfTwo.length - 1]);
    var powers2Length = powersOfTwo.length, highestPower2 = powersOfTwo[powers2Length - 1];

    function shift_isSmall(n) {
        return (typeof n === "number" || typeof n === "string") && +Math.abs(n) <= BASE || n instanceof BigInteger && n.value.length <= 1
    }

    BigInteger.prototype.shiftLeft = function (n) {
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.")
        }
        n = +n;
        if (n < 0) return this.shiftRight(-n);
        var result = this;
        while (n >= powers2Length) {
            result = result.multiply(highestPower2);
            n -= powers2Length - 1
        }
        return result.multiply(powersOfTwo[n])
    };
    SmallInteger.prototype.shiftLeft = BigInteger.prototype.shiftLeft;
    BigInteger.prototype.shiftRight = function (n) {
        var remQuo;
        if (!shift_isSmall(n)) {
            throw new Error(String(n) + " is too large for shifting.")
        }
        n = +n;
        if (n < 0) return this.shiftLeft(-n);
        var result = this;
        while (n >= powers2Length) {
            if (result.isZero()) return result;
            remQuo = divModAny(result, highestPower2);
            result = remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0];
            n -= powers2Length - 1
        }
        remQuo = divModAny(result, powersOfTwo[n]);
        return remQuo[1].isNegative() ? remQuo[0].prev() : remQuo[0]
    };
    SmallInteger.prototype.shiftRight = BigInteger.prototype.shiftRight;

    function bitwise(x, y, fn) {
        y = parseValue(y);
        var xSign = x.isNegative(), ySign = y.isNegative();
        var xRem = xSign ? x.not() : x, yRem = ySign ? y.not() : y;
        var xDigit = 0, yDigit = 0;
        var xDivMod = null, yDivMod = null;
        var result = [];
        while (!xRem.isZero() || !yRem.isZero()) {
            xDivMod = divModAny(xRem, highestPower2);
            xDigit = xDivMod[1].toJSNumber();
            if (xSign) {
                xDigit = highestPower2 - 1 - xDigit
            }
            yDivMod = divModAny(yRem, highestPower2);
            yDigit = yDivMod[1].toJSNumber();
            if (ySign) {
                yDigit = highestPower2 - 1 - yDigit
            }
            xRem = xDivMod[0];
            yRem = yDivMod[0];
            result.push(fn(xDigit, yDigit))
        }
        var sum = fn(xSign ? 1 : 0, ySign ? 1 : 0) !== 0 ? bigInt(-1) : bigInt(0);
        for (var i = result.length - 1; i >= 0; i -= 1) {
            sum = sum.multiply(highestPower2).add(bigInt(result[i]))
        }
        return sum
    }

    BigInteger.prototype.not = function () {
        return this.negate().prev()
    };
    SmallInteger.prototype.not = BigInteger.prototype.not;
    BigInteger.prototype.and = function (n) {
        return bitwise(this, n, function (a, b) {
            return a & b
        })
    };
    SmallInteger.prototype.and = BigInteger.prototype.and;
    BigInteger.prototype.or = function (n) {
        return bitwise(this, n, function (a, b) {
            return a | b
        })
    };
    SmallInteger.prototype.or = BigInteger.prototype.or;
    BigInteger.prototype.xor = function (n) {
        return bitwise(this, n, function (a, b) {
            return a ^ b
        })
    };
    SmallInteger.prototype.xor = BigInteger.prototype.xor;
    var LOBMASK_I = 1 << 30, LOBMASK_BI = (BASE & -BASE) * (BASE & -BASE) | LOBMASK_I;

    function roughLOB(n) {
        var v = n.value,
            x = typeof v === "number" ? v | LOBMASK_I : v[0] + v[1] * BASE | LOBMASK_BI;
        return x & -x
    }

    function max(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.greater(b) ? a : b
    }

    function min(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        return a.lesser(b) ? a : b
    }

    function gcd(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        if (a.equals(b)) return a;
        if (a.isZero()) return b;
        if (b.isZero()) return a;
        var c = Integer[1], d, t;
        while (a.isEven() && b.isEven()) {
            d = Math.min(roughLOB(a), roughLOB(b));
            a = a.divide(d);
            b = b.divide(d);
            c = c.multiply(d)
        }
        while (a.isEven()) {
            a = a.divide(roughLOB(a))
        }
        do {
            while (b.isEven()) {
                b = b.divide(roughLOB(b))
            }
            if (a.greater(b)) {
                t = b;
                b = a;
                a = t
            }
            b = b.subtract(a)
        } while (!b.isZero());
        return c.isUnit() ? a : a.multiply(c)
    }

    function lcm(a, b) {
        a = parseValue(a).abs();
        b = parseValue(b).abs();
        return a.divide(gcd(a, b)).multiply(b)
    }

    function randBetween(a, b) {
        a = parseValue(a);
        b = parseValue(b);
        var low = min(a, b), high = max(a, b);
        var range = high.subtract(low).add(1);
        if (range.isSmall) return low.add(Math.floor(Math.random() * range));
        var length = range.value.length - 1;
        var result = [], restricted = true;
        for (var i = length; i >= 0; i--) {
            var top = restricted ? range.value[i] : BASE;
            var digit = truncate(Math.random() * top);
            result.unshift(digit);
            if (digit < top) restricted = false
        }
        result = arrayToSmall(result);
        return low.add(typeof result === "number" ? new SmallInteger(result) : new BigInteger(result, false))
    }

    var parseBase = function (text, base) {
        var length = text.length;
        var i;
        var absBase = Math.abs(base);
        for (var i = 0; i < length; i++) {
            var c = text[i].toLowerCase();
            if (c === "-") continue;
            if (/[a-z0-9]/.test(c)) {
                if (/[0-9]/.test(c) && +c >= absBase) {
                    if (c === "1" && absBase === 1) continue;
                    throw new Error(c + " is not a valid digit in base " + base + ".")
                } else if (c.charCodeAt(0) - 87 >= absBase) {
                    throw new Error(c + " is not a valid digit in base " + base + ".")
                }
            }
        }
        if (2 <= base && base <= 36) {
            if (length <= LOG_MAX_INT / Math.log(base)) {
                var result = parseInt(text, base);
                if (isNaN(result)) {
                    throw new Error(c + " is not a valid digit in base " + base + ".")
                }
                return new SmallInteger(parseInt(text, base))
            }
        }
        base = parseValue(base);
        var digits = [];
        var isNegative = text[0] === "-";
        for (i = isNegative ? 1 : 0; i < text.length; i++) {
            var c = text[i].toLowerCase(), charCode = c.charCodeAt(0);
            if (48 <= charCode && charCode <= 57) digits.push(parseValue(c)); else if (97 <= charCode && charCode <= 122) digits.push(parseValue(c.charCodeAt(0) - 87)); else if (c === "<") {
                var start = i;
                do {
                    i++
                } while (text[i] !== ">");
                digits.push(parseValue(text.slice(start + 1, i)))
            } else throw new Error(c + " is not a valid character")
        }
        return parseBaseFromArray(digits, base, isNegative)
    };

    function parseBaseFromArray(digits, base, isNegative) {
        var val = Integer[0], pow = Integer[1], i;
        for (i = digits.length - 1; i >= 0; i--) {
            val = val.add(digits[i].times(pow));
            pow = pow.times(base)
        }
        return isNegative ? val.negate() : val
    }

    function stringify(digit) {
        var v = digit.value;
        if (typeof v === "number") v = [v];
        if (v.length === 1 && v[0] <= 35) {
            return "0123456789abcdefghijklmnopqrstuvwxyz".charAt(v[0])
        }
        return "<" + v + ">"
    }

    function toBase(n, base) {
        base = bigInt(base);
        if (base.isZero()) {
            if (n.isZero()) return "0";
            throw new Error("Cannot convert nonzero numbers to base 0.")
        }
        if (base.equals(-1)) {
            if (n.isZero()) return "0";
            if (n.isNegative()) return new Array(1 - n).join("10");
            return "1" + new Array(+n).join("01")
        }
        var minusSign = "";
        if (n.isNegative() && base.isPositive()) {
            minusSign = "-";
            n = n.abs()
        }
        if (base.equals(1)) {
            if (n.isZero()) return "0";
            return minusSign + new Array(+n + 1).join(1)
        }
        var out = [];
        var left = n, divmod;
        while (left.isNegative() || left.compareAbs(base) >= 0) {
            divmod = left.divmod(base);
            left = divmod.quotient;
            var digit = divmod.remainder;
            if (digit.isNegative()) {
                digit = base.minus(digit).abs();
                left = left.next()
            }
            out.push(stringify(digit))
        }
        out.push(stringify(left));
        return minusSign + out.reverse().join("")
    }

    BigInteger.prototype.toString = function (radix) {
        if (radix === undefined) radix = 10;
        if (radix !== 10) return toBase(this, radix);
        var v = this.value, l = v.length, str = String(v[--l]), zeros = "0000000", digit;
        while (--l >= 0) {
            digit = String(v[l]);
            str += zeros.slice(digit.length) + digit
        }
        var sign = this.sign ? "-" : "";
        return sign + str
    };
    SmallInteger.prototype.toString = function (radix) {
        if (radix === undefined) radix = 10;
        if (radix != 10) return toBase(this, radix);
        return String(this.value)
    };
    BigInteger.prototype.toJSON = SmallInteger.prototype.toJSON = function () {
        return this.toString()
    };
    BigInteger.prototype.valueOf = function () {
        return +this.toString()
    };
    BigInteger.prototype.toJSNumber = BigInteger.prototype.valueOf;
    SmallInteger.prototype.valueOf = function () {
        return this.value
    };
    SmallInteger.prototype.toJSNumber = SmallInteger.prototype.valueOf;

    function parseStringValue(v) {
        if (isPrecise(+v)) {
            var x = +v;
            if (x === truncate(x)) return new SmallInteger(x);
            throw"Invalid integer: " + v
        }
        var sign = v[0] === "-";
        if (sign) v = v.slice(1);
        var split = v.split(/e/i);
        if (split.length > 2) throw new Error("Invalid integer: " + split.join("e"));
        if (split.length === 2) {
            var exp = split[1];
            if (exp[0] === "+") exp = exp.slice(1);
            exp = +exp;
            if (exp !== truncate(exp) || !isPrecise(exp)) throw new Error("Invalid integer: " + exp + " is not a valid exponent.");
            var text = split[0];
            var decimalPlace = text.indexOf(".");
            if (decimalPlace >= 0) {
                exp -= text.length - decimalPlace - 1;
                text = text.slice(0, decimalPlace) + text.slice(decimalPlace + 1)
            }
            if (exp < 0) throw new Error("Cannot include negative exponent part for integers");
            text += new Array(exp + 1).join("0");
            v = text
        }
        var isValid = /^([0-9][0-9]*)$/.test(v);
        if (!isValid) throw new Error("Invalid integer: " + v);
        var r = [], max = v.length, l = LOG_BASE, min = max - l;
        while (max > 0) {
            r.push(+v.slice(min, max));
            min -= l;
            if (min < 0) min = 0;
            max -= l
        }
        trim(r);
        return new BigInteger(r, sign)
    }

    function parseNumberValue(v) {
        if (isPrecise(v)) {
            if (v !== truncate(v)) throw new Error(v + " is not an integer.");
            return new SmallInteger(v)
        }
        return parseStringValue(v.toString())
    }

    function parseValue(v) {
        if (typeof v === "number") {
            return parseNumberValue(v)
        }
        if (typeof v === "string") {
            return parseStringValue(v)
        }
        return v
    }

    for (var i = 0; i < 1e3; i++) {
        Integer[i] = new SmallInteger(i);
        if (i > 0) Integer[-i] = new SmallInteger(-i)
    }
    Integer.one = Integer[1];
    Integer.zero = Integer[0];
    Integer.minusOne = Integer[-1];
    Integer.max = max;
    Integer.min = min;
    Integer.gcd = gcd;
    Integer.lcm = lcm;
    Integer.isInstance = function (x) {
        return x instanceof BigInteger || x instanceof SmallInteger
    };
    Integer.randBetween = randBetween;
    Integer.fromArray = function (digits, base, isNegative) {
        return parseBaseFromArray(digits.map(parseValue), parseValue(base || 10), isNegative)
    };
    return Integer
}();
if (typeof module !== "undefined" && module.hasOwnProperty("exports")) {
    module.exports = bigInt
}
if (typeof define === "function" && define.amd) {
    define("big-integer", [], function () {
        return bigInt
    })
}

const fractionTemplate = "^-?\\d+\/\\d+$";
const realTemplate = "^-?\\d+([\\.\\,]\\d+)?$";

function Fraction(text = "0") {
    if (text != "" && text.match(new RegExp(fractionTemplate)) == null && text.match(new RegExp(realTemplate)) == null) throw"Некорректная дробь!";
    text = text.replace(/,/gi, ".");
    var index = text.indexOf("/");
    this.n = bigInt.zero;
    this.m = bigInt.one;
    if (index > -1) {
        this.n = bigInt(text.substr(0, index));
        this.m = bigInt(text.substr(index + 1));
    } else if ((index = text.indexOf("e")) > -1) {
        throw"Невозможно получить дробь. Используйте обычную форму записи вместо экспонециальной.";
    } else {
        index = text.indexOf(".");
        if (index > -1) {
            var sign = text[0] == "-" ? -1 : 1;
            var int = bigInt(text.substr(0, index));
            var float = text.substr(index + 1);
            index = float.length - 1;
            while (index > 0 && float[index] == "0") index--;
            float = bigInt(float.substr(0, index + 1));
            this.m = bigInt(10).pow(index + 1);
            this.n = bigInt(int).abs().multiply(this.m).add(float);
            this.n = this.n.multiply(sign);
        } else {
            this.n = bigInt(text);
            this.m = bigInt.one;
        }
    }
    this.reduce();
}

Fraction.prototype.reduce = function () {
    var nod = bigInt.gcd(this.n, this.m).abs();
    this.n = this.n.divide(nod);
    this.m = this.m.divide(nod);
}
Fraction.prototype.print = function (view = 1, digits = 5) {
    if (view == -1) {
        var result = this.n.toString();
        if (!this.m.equals(bigInt.one)) result += "/" + this.m.toString();
        return result;
    }
    if (view == 2) {
        var s = this.n.abs().multiply(bigInt(10).pow(digits)).divide(this.m).toString();
        while (s.length < digits) s = "0" + s;
        var int = s.substr(0, s.length - digits);
        var real = s.substr(s.length - digits, digits);
        if (int == "") int = "0";
        var index = real.length;
        while (index > 1 && real[index - 1] == "0") index--;
        real = real.substr(0, index);
        return (this.n.isNegative() ? "-" : "") + int + (real == "0" ? "" : "." + real);
    }
    if (this.m.equals(bigInt.one)) return this.n.toString();
    var html = "";
    if (this.n.isNegative()) html += "- ";
    if (view == 0) {
        var int = this.n.divide(this.m).abs();
        var n = this.n.abs().mod(this.m);
        if (!int.isZero()) html += int.toString();
        if (!n.isZero()) html += "<div class='fraction'><div class='numerator'>" + n.toString() + "</div><div class='denumerator'>" + this.m.toString() + "</div></div>";
    } else {
        html += "<div class='fraction'><div class='numerator'>" + this.n.abs().toString() + "</div><div class='denumerator'>" + this.m.toString() + "</div></div>";
    }
    return html;
}
Fraction.prototype.printNg = function (view, digits) {
    return this.n.isNegative() ? "(" + this.print(view, digits) + ")" : this.print(view, digits);
}
Fraction.prototype.toString = function () {
    if (this.m.equals(bigInt.one)) return this.n.toString();
    return this.n.toString() + "/" + this.m.toString();
}
Fraction.prototype.mult = function (b) {
    let result = new Fraction();
    result.n = this.n.multiply(b.n)
    result.m = this.m.multiply(b.m)
    result.reduce()
    return result;
}
Fraction.prototype.div = function (b) {
    let result = new Fraction();
    result.n = this.n.multiply(b.m)
    result.m = this.m.multiply(b.n)
    if (result.m.isNegative()) {
        result.m = result.m.abs();
        result.n = result.n.multiply(bigInt(-1));
    }
    result.reduce()
    return result;
}
Fraction.prototype.add = function (b) {
    let nod = bigInt.gcd(this.m, b.m).abs();
    let nok = bigInt.lcm(this.m, b.m).abs();
    let result = new Fraction();
    result.n = this.n.multiply(nok).divide(this.m).plus(b.n.multiply(nok).divide(b.m));
    result.m = nok;
    result.reduce();
    return result;
}
Fraction.prototype.sub = function (b) {
    let nod = bigInt.gcd(this.m, b.m).abs();
    let nok = bigInt.lcm(this.m, b.m).abs();
    let result = new Fraction()
    result.n = this.n.multiply(nok).divide(this.m).minus(b.n.multiply(nok).divide(b.m));
    result.m = nok;
    result.reduce();
    return result;
}
Fraction.prototype.changeSign = function () {
    this.n = this.n.multiply(-1);
}
Fraction.prototype.isNeg = function () {
    return this.n.isNegative();
}
Fraction.prototype.isPos = function () {
    return this.n.isPositive();
}
Fraction.prototype.isZero = function () {
    return this.n.isZero()
}
Fraction.prototype.isOne = function () {
    return this.n.equals(bigInt.one) && this.m.equals(bigInt.one);
}
Fraction.prototype.isInf = function () {
    return this.m.isZero()
}
Fraction.prototype.gt = function (b) {
    return this.sub(b).isPos();
}
Fraction.prototype.lt = function (b) {
    return this.sub(b).isNeg();
}
Fraction.prototype.eq = function (b) {
    return this.n.equals(b.n) && this.m.equals(b.m);
}
Fraction.prototype.abs = function () {
    let result = new Fraction();
    result.n = this.n;
    result.m = this.m;
    if (result.isNeg()) result.changeSign();
    return result;
}

const LE = "≤";
const EQ = "=";
const GE = "≥";
const MAX = "max"
const MIN = "min"
const NEGATIVE_BASIS = false;
let NEED_LOGS = true;
const GENERATE_SAMPLES = false;
let varsBox = document.getElementById("varsBox");
let restrBox = document.getElementById("restrBox");
let funcBox = document.getElementById("function");
let restrictionsBox = document.getElementById("restrictions");
let solveBox = document.getElementById("simplex-solve");
let modeBox = document.getElementById("mode");
let solveType = document.getElementById("solveType")
let withSolveBox = document.getElementById('withSolveBox')
let asFraqtions = document.getElementById('asFraqtions')
let printMode = 1;
let historyValues = null
$('#withSolveBox').change(function () {
    $('#solveType').slideToggle();
});

function SetInputFilter(textbox, inputFilter) {
    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.hasOwnProperty("oldValue")) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            }
        });
    });
}

function InputFilter(value) {
    return /^-?\d*([\.\/]\d*)?$/.test(value);
}

function updateScrollblocks() {
    $(".scroll-block").each(function () {
        if ($(this)[0].scrollWidth > $(this).width() + 1) $(this).addClass("scroll-block-img"); else
            $(this).removeClass("scroll-block-img");
    });
}

function updateHideOpenBlock() {
    $('.ho-block-text').off('click');
    $(".ho-block-text").click(function () {
        $(this).siblings(".ho-block-content").slideToggle();
        $(this).find(".fa").toggleClass("fa-caret-down").toggleClass("fa-caret-right");
        updateScrollblocks();
    })
}

function scrollTo(selector) {
    window.scroll({top: $(selector).offset().top - $(".menu2").outerHeight(), behavior: 'smooth'});
}

function CreateHideOpenBlock(text, content) {
    let html = "<div class='hide-open-block'>"
    html += "<div class='ho-block-text'><span class='fa fa-caret-right'></span>" + text + "</div>"
    html += "<div class='ho-block-content'>" + content + "</div>"
    html += "</div>"
    return html
}

function CreateScrollBlock(text) {
    return "<div class='scroll-block'>" + text + "</div>"
}

function IniFunctionBox(n) {
    while (funcBox.children.length > 0) funcBox.children[0].remove()
    for (let i = 0; i < n; i++) {
        let elem = document.createElement("input");
        elem.style.width = "45px";
        elem.id = "var" + i;
        elem.placeholder = "0";
        elem.inputMode = 'numeric'
        elem.autocomplete = 'off'
        let name = document.createElement("span")
        name.innerHTML = " x<sub>" + (i + 1) + "</sub> " + (i == n - 1 ? "" : "+ ");
        funcBox.appendChild(elem);
        funcBox.appendChild(name);
    }
}

function InitRestrictions(n, m) {
    while (restrictionsBox.children.length > 0) restrictionsBox.children[0].remove();
    for (let i = 0; i < m; i++) {
        let rest = document.createElement("div");
        rest.id = "rest-" + i + "-box";
        rest.className = "restriction-div";
        for (let j = 0; j < n; j++) {
            let elem = document.createElement("input");
            elem.style.width = "45px";
            elem.id = "rest-" + i + "-" + j;
            elem.placeholder = "0";
            elem.inputMode = 'numeric'
            elem.autocomplete = 'off'
            let name = document.createElement("span")
            name.innerHTML = " x<sub>" + (j + 1) + "</sub> " + (j == n - 1 ? "" : "+ ");
            rest.appendChild(elem);
            rest.appendChild(name);
        }
        let select = document.createElement("select")
        select.id = "cond-" + i;
        let options = [LE, EQ, GE]
        for (let j = 0; j < options.length; j++) {
            let option = document.createElement("option")
            option.text = options[j]
            option.value = options[j]
            select.appendChild(option)
        }
        rest.appendChild(select);
        let elem = document.createElement("input");
        elem.style.width = "45px";
        elem.id = "rest-" + i + "-value";
        elem.style.textAlign = "left"
        elem.placeholder = "0";
        elem.inputMode = 'numeric'
        elem.autocomplete = 'off'
        rest.innerHTML += " ";
        rest.appendChild(elem);
        restrictionsBox.appendChild(rest);
    }
    let names = document.createElement("span");
    for (let i = 0; i < n - 1; i++) names.innerHTML += "x<sub>" + (i + 1) + "</sub>, "
    names.innerHTML += "x<sub>" + n + "</sub> &ge; 0";
    let block = document.getElementById("rest-vars");
    while (block.children.length > 0) block.children[0].remove();
    block.appendChild(names);
}

function MoveCell(cell, e) {
    let id = cell.id;
    let n = +varsBox.value
    let m = +restrBox.value
    var text = cell.value
    var start = cell.selectionStart;
    var end = cell.selectionEnd;
    var min = Math.min(start, end);
    var max = Math.max(start, end);
    var len = Math.abs(start - end);
    if (id.substr(0, 3) == "var") {
        let index = +id.substr(3);
        if (e.key == "ArrowRight") index = (index + 1) % n; else if (e.key == "ArrowLeft") index = (index - 1 + n) % n;
        id = "var" + index;
    } else {
        let args = id.split('-')
        let row = +args[1];
        let column = args[2] == "value" ? n : +args[2]
        let index = row * (n + 1) + column;
        let total = (n + 1) * m;
        if (e.key == "ArrowRight" && max == text.length) {
            index = (index + 1) % total
        } else if (e.key == "ArrowLeft" && min == 0) {
            index = (index - 1 + total) % total;
        } else if (e.key == "ArrowDown") {
            row++
            column = (column + Math.floor(row / m)) % (n + 1)
            row = row % m;
            index = row * (n + 1) + column;
        } else if (e.key == "ArrowUp") {
            row--
            column = (column - (row == -1 ? 1 : 0) + n + 1) % (n + 1)
            row = (row + m) % m;
            index = row * (n + 1) + column;
        }
        row = Math.floor(index / (n + 1))
        column = index % (n + 1);
        if (column < n) {
            id = "rest-" + row + "-" + column
        } else {
            id = "rest-" + row + "-value"
        }
    }
    if (cell.id == id) return;
    let elem = document.getElementById(id);
    elem.focus()
    text = elem.value
    if (e.key == "ArrowLeft") {
        elem.selectionStart = text.length
        elem.selectionEnd = text.length
    } else {
        elem.selectionStart = 0
        elem.selectionEnd = 0
    }
}

function SaveValues() {
    let func = []
    for (let i = 0; i < funcBox.children.length; i += 2) func.push(funcBox.children[i].value)
    let restrictions = []
    let free = []
    for (let i = 0; i < restrictionsBox.children.length; i++) {
        restrictions[i] = []
        for (let j = 0; j < restrictionsBox.children[i].children.length - 2; j += 2) restrictions[i].push(restrictionsBox.children[i].children[j].value)
        free.push(restrictionsBox.children[i].children[restrictionsBox.children[i].children.length - 1].value)
    }
    return {func: func, restrictions: restrictions, free: free}
}

function InitTable() {
    if (varsBox.value == "" || restrBox.value == "") return;
    let n = +varsBox.value
    let m = +restrBox.value
    if (n < 1 || m < 1) return;
    historyValues = SaveValues()
    IniFunctionBox(n);
    InitRestrictions(n, m);
    for (let i = 0; i < n; i++) {
        let func = document.getElementById("var" + i)
        SetInputFilter(func, InputFilter);
        func.addEventListener('keydown', (event) => {
            MoveCell(func, event)
        }, false);
        if (i < historyValues.func.length && historyValues.func[i] != "") func.value = historyValues.func[i]
    }
    for (let i = 0; i < m; i++) {
        let value = document.getElementById("rest-" + i + "-value");
        SetInputFilter(value, InputFilter);
        value.addEventListener('keydown', (event) => {
            MoveCell(value, event)
        }, false)
        if (i < historyValues.free.length && historyValues.free[i] != "") value.value = historyValues.free[i]
        for (let j = 0; j < n; j++) {
            let rest = document.getElementById("rest-" + i + "-" + j)
            SetInputFilter(rest, InputFilter);
            rest.addEventListener('keydown', (event) => {
                MoveCell(rest, event)
            }, false)
            if (i < historyValues.restrictions.length && j < historyValues.restrictions[i].length && historyValues.restrictions[i][j] != "") rest.value = historyValues.restrictions[i][j]
        }
    }
}

function Clear() {
    if (!confirm("Вы уверены, что хотите всё удалить?")) return;
    let n = +varsBox.value
    let m = +restrBox.value
    for (let i = 0; i < n; i++) document.getElementById("var" + i).value = "";
    for (let i = 0; i < m; i++) {
        document.getElementById("rest-" + i + "-value").value = "";
        for (let j = 0; j < n; j++) document.getElementById("rest-" + i + "-" + j).value = "";
    }
    solveBox.innerHTML = ""
}

function SetSizes(n, m) {
    varsBox.value = n
    restrBox.value = m
    IniFunctionBox(n)
    InitRestrictions(n, m);
}

function SetFunctionValue(i, value) {
    document.getElementById("var" + i).value = value;
}

function SetRestrictionValue(j, i, value) {
    document.getElementById("rest-" + j + "-" + i).value = value;
}

function SetFreeRestrictionValue(i, value) {
    document.getElementById("rest-" + i + "-value").value = value;
}

function SetRestrictionMode(i, mode) {
    document.getElementById("cond-" + i).value = mode;
}

function SetFunctionMode(mode) {
    document.getElementById("mode").value = mode;
}

function SetInitValues(k = 1) {
    let n = +varsBox.value
    let m = +restrBox.value
    if (k == 1) {
        SetSizes(3, 3);
        SetFunctionValue(0, 4);
        SetFunctionValue(1, 5);
        SetFunctionValue(2, 4);
        SetRestrictionValue(0, 0, 2);
        SetRestrictionValue(0, 1, 3);
        SetRestrictionValue(0, 2, 6);
        SetRestrictionMode(0, GE);
        SetFreeRestrictionValue(0, 240);
        SetRestrictionValue(1, 0, 4);
        SetRestrictionValue(1, 1, 2);
        SetRestrictionValue(1, 2, 4);
        SetRestrictionMode(1, LE);
        SetFreeRestrictionValue(1, 200);
        SetRestrictionValue(2, 0, 4);
        SetRestrictionValue(2, 1, 6);
        SetRestrictionValue(2, 2, 8);
        SetRestrictionMode(2, EQ);
        SetFreeRestrictionValue(2, 160);
        SetFunctionMode(MAX);
    } else if (k == 2) {
        SetSizes(3, 3);
        SetFunctionValue(0, 20);
        SetFunctionValue(1, 20);
        SetFunctionValue(2, 10);
        SetRestrictionValue(0, 0, 4);
        SetRestrictionValue(0, 1, 3);
        SetRestrictionValue(0, 2, 2);
        SetRestrictionMode(0, GE);
        SetFreeRestrictionValue(0, 33);
        SetRestrictionValue(1, 0, 3);
        SetRestrictionValue(1, 1, 2);
        SetRestrictionValue(1, 2, 1);
        SetRestrictionMode(1, GE);
        SetFreeRestrictionValue(1, 23);
        SetRestrictionValue(2, 0, 1);
        SetRestrictionValue(2, 1, 1);
        SetRestrictionValue(2, 2, 2);
        SetRestrictionMode(2, GE);
        SetFreeRestrictionValue(2, 12);
        SetFunctionMode(MIN);
    } else if (k == 3) {
        SetSizes(3, 3);
        SetFunctionValue(0, 2);
        SetFunctionValue(1, 1);
        SetFunctionValue(2, -2);
        SetRestrictionValue(0, 0, 1);
        SetRestrictionValue(0, 1, 1);
        SetRestrictionValue(0, 2, -1);
        SetRestrictionMode(0, GE);
        SetFreeRestrictionValue(0, 8);
        SetRestrictionValue(1, 0, 1);
        SetRestrictionValue(1, 1, -1);
        SetRestrictionValue(1, 2, 2);
        SetRestrictionMode(1, GE);
        SetFreeRestrictionValue(1, 2);
        SetRestrictionValue(2, 0, -2);
        SetRestrictionValue(2, 1, -8);
        SetRestrictionValue(2, 2, 3);
        SetRestrictionMode(2, GE);
        SetFreeRestrictionValue(2, 1);
        SetFunctionMode(MIN);
    } else if (k == 4) {
        SetSizes(6, 3);
        let f = [3, 0, 2, 0, 0, -6];
        let r = [[2, 1, -3, 0, 0, 6], [-3, 0, 2, 1, 0, -2], [1, 0, 3, 0, 5, -4],]
        let b = [18, 24, 36]
        let signs = [EQ, EQ, EQ]
        for (let i = 0; i < f.length; i++) SetFunctionValue(i, f[i]);
        for (let i = 0; i < r.length; i++) {
            for (let j = 0; j < r[i].length; j++) SetRestrictionValue(i, j, r[i][j]);
            SetFreeRestrictionValue(i, b[i]);
            SetRestrictionMode(i, signs[i]);
        }
    } else if (k == 5) {
        SetSizes(2, 2);
        SetFunctionValue(0, 1);
        SetFunctionValue(1, 2);
        SetFunctionMode(MAX)
        SetRestrictionValue(0, 0, 1);
        SetRestrictionValue(0, 1, 1);
        SetRestrictionMode(0, EQ)
        SetFreeRestrictionValue(0, 1);
        SetRestrictionValue(1, 0, 2);
        SetRestrictionValue(1, 1, 2);
        SetRestrictionMode(1, EQ)
        SetFreeRestrictionValue(1, 2);
    } else if (k == 6) {
        SetSizes(5, 3);
        SetFunctionValue(0, 9);
        SetFunctionValue(1, 5);
        SetFunctionValue(2, 4);
        SetFunctionValue(3, 3);
        SetFunctionValue(4, 2);
        SetFunctionMode(MAX);
        SetRestrictionValue(0, 0, 1);
        SetRestrictionValue(0, 1, -2);
        SetRestrictionValue(0, 2, 2);
        SetRestrictionValue(0, 3, 0);
        SetRestrictionValue(0, 4, 0);
        SetRestrictionMode(0, LE)
        SetFreeRestrictionValue(0, 6);
        SetRestrictionValue(1, 0, 1);
        SetRestrictionValue(1, 1, 2);
        SetRestrictionValue(1, 2, 1);
        SetRestrictionValue(1, 3, 1);
        SetRestrictionValue(1, 4, 0);
        SetRestrictionMode(1, EQ)
        SetFreeRestrictionValue(1, 24);
        SetRestrictionValue(2, 0, 2);
        SetRestrictionValue(2, 1, 1);
        SetRestrictionValue(2, 2, -4);
        SetRestrictionValue(2, 3, 0);
        SetRestrictionValue(2, 4, 1);
        SetRestrictionMode(2, EQ)
        SetFreeRestrictionValue(2, 30);
    } else if (k == 7) {
        SetSizes(5, 3);
        SetFunctionValue(0, 0);
        SetFunctionValue(1, 0);
        SetFunctionValue(2, 3);
        SetFunctionValue(3, -2);
        SetFunctionValue(4, -1);
        SetFunctionMode(MAX);
        SetRestrictionValue(0, 0, 2);
        SetRestrictionValue(0, 1, 1);
        SetRestrictionValue(0, 2, 1);
        SetRestrictionValue(0, 3, 1);
        SetRestrictionValue(0, 4, 3);
        SetRestrictionMode(0, EQ);
        SetFreeRestrictionValue(0, 5);
        SetRestrictionValue(1, 0, 3);
        SetRestrictionValue(1, 1, 0);
        SetRestrictionValue(1, 2, 2);
        SetRestrictionValue(1, 3, -1);
        SetRestrictionValue(1, 4, 6);
        SetRestrictionMode(1, EQ);
        SetFreeRestrictionValue(1, 7);
        SetRestrictionValue(2, 0, 1);
        SetRestrictionValue(2, 1, 0);
        SetRestrictionValue(2, 2, -3);
        SetRestrictionValue(2, 3, 2);
        SetRestrictionValue(2, 4, 1);
        SetRestrictionMode(2, EQ);
        SetFreeRestrictionValue(2, 2);
    } else if (k == 8) {
        SetSizes(3, 3);
        SetFunctionValue(0, 1);
        SetFunctionValue(1, -1);
        SetFunctionValue(2, 0);
        SetFunctionMode(MIN)
        SetRestrictionValue(0, 0, 2);
        SetRestrictionValue(0, 1, 1);
        SetRestrictionValue(0, 2, 3);
        SetRestrictionMode(0, EQ);
        SetFreeRestrictionValue(0, 1);
        SetRestrictionValue(1, 0, 1);
        SetRestrictionValue(1, 1, -3);
        SetRestrictionValue(1, 2, 1);
        SetRestrictionMode(1, EQ);
        SetFreeRestrictionValue(1, -3);
        SetRestrictionValue(2, 0, 1);
        SetRestrictionValue(2, 1, 11);
        SetRestrictionValue(2, 2, 3);
        SetRestrictionMode(2, EQ);
        SetFreeRestrictionValue(2, 11);
    } else if (k == 9) {
        SetSizes(3, 3);
        SetFunctionValue(0, 3);
        SetFunctionValue(1, 2);
        SetFunctionValue(2, 3);
        SetFunctionMode(MIN)
        SetRestrictionValue(0, 0, 2)
        SetRestrictionValue(0, 1, 1)
        SetRestrictionValue(0, 2, 1)
        SetRestrictionMode(0, LE)
        SetFreeRestrictionValue(0, 2)
        SetRestrictionValue(1, 0, 3)
        SetRestrictionValue(1, 1, 8)
        SetRestrictionValue(1, 2, 2)
        SetRestrictionMode(1, GE)
        SetFreeRestrictionValue(1, 8)
        SetRestrictionValue(2, 0, 0)
        SetRestrictionValue(2, 1, 0)
        SetRestrictionValue(2, 2, 1)
        SetRestrictionMode(2, GE)
        SetFreeRestrictionValue(2, 1)
    }
}

function GetFunctionCoefficients(n) {
    let func = []
    for (let i = 0; i < n; i++) {
        let field = document.getElementById("var" + i);
        try {
            func.push(new Fraction(field.value))
        } catch (e) {
            field.focus()
            throw e
        }
    }
    return func;
}

function GetRestrictCoefficients(n, m) {
    let restricts = []
    for (let i = 0; i < m; i++) {
        restricts[i] = {values: [], sign: document.getElementById("cond-" + i).value,}
        for (let j = 0; j < n; j++) {
            let field = document.getElementById("rest-" + i + "-" + j);
            try {
                restricts[i].values.push(new Fraction(field.value))
            } catch (e) {
                field.focus()
                throw e
            }
        }
        let field = document.getElementById("rest-" + i + "-value");
        try {
            restricts[i].b = new Fraction(field.value)
        } catch (e) {
            field.focus()
            throw e
        }
    }
    return restricts;
}

function PrintFunction(func) {
    let html = "";
    let start = false
    for (let i = 0; i < func.length; i++) {
        if (!func[i].n.isZero()) {
            if (start && func[i].isPos()) {
                html += "+ ";
            }
            if (func[i].isNeg()) {
                if (func[i].abs().isOne()) html += "- "; else
                    html += "- " + func[i].abs().print(printMode) + "·";
            } else {
                if (!func[i].isOne()) html += func[i].print(printMode) + "·";
            }
            html += "x<sub>" + (i + 1) + "</sub> ";
            start = true;
        }
    }
    if (!start) html += "0";
    return html;
}

function ChangeSigns(restricts) {
    let html = "<b>Меняем знаки у ограничений с " + GE + ", путём умножения на -1:</b><br>";
    let have = false;
    for (let i = 0; i < restricts.length; i++) {
        if (restricts[i].sign == GE) {
            restricts[i].sign = LE;
            for (let j = 0; j < restricts[i].values.length; j++) restricts[i].values[j].changeSign()
            restricts[i].b.changeSign()
            have = true;
        }
        html += PrintFunction(restricts[i].values);
        html += " " + restricts[i].sign + " "
        html += restricts[i].b.print(printMode);
        html += "<br>"
    }
    html += "<br>"
    return have ? html : "";
}

function PrepareTable(n, m, func, restricts, mode) {
    let k = 0;
    for (let i = 0; i < restricts.length; i++) if (restricts[i].sign != EQ) k++;
    let simplex = {
        n: n,
        m: m,
        total: n + k,
        mode: mode,
        table: [],
        b: [],
        basis: [],
        C: [],
        deltas: [],
        Q: []
    }
    let html = ""
    if (k > 2) {
        html += "Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>" + (n + 1) + "</sub>..x<sub>" + (n + k) + "</sub>.<br>"
    } else if (k == 2) {
        html += "Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>" + (n + 1) + "</sub> и x<sub>" + (n + k) + "</sub>.<br>"
    } else if (k == 1) {
        html += "Для ограничения с неравенством <b>добавляем дополнительную переменную</b> x<sub>" + (n + 1) + "</sub>.<br>"
    }
    for (let i = 0; i < n; i++) simplex.C.push(func[i])
    for (let i = 0; i < k; i++) simplex.C.push(new Fraction());
    simplex.C.push(new Fraction("0"))
    let findHtml = "<b>Ищем начальное базисное решение:</b><br>"
    let index = 0;
    let unknown = -1;
    let basisHtml = []
    let systemHtml = "";
    for (let i = 0; i < m; i++) {
        simplex.table[i] = []
        for (let j = 0; j < n; j++) simplex.table[i].push(restricts[i].values[j]);
        let inserted = false;
        if (restricts[i].sign == EQ) {
            simplex.basis.push(unknown);
            unknown--;
            basisHtml[simplex.basis.length - 1] = "Ограничение " + (i + 1) + " содержит равенство. Базисная переменная для этого ограничения будет определена позднее.<br>";
        } else if (NEGATIVE_BASIS && restricts[i].sign == GE) {
            simplex.basis.push(unknown);
            unknown--;
            basisHtml[simplex.basis.length - 1] = "Ограничение " + (i + 1) + " содержит неравенство с " + GE + ". Базисная переменная для этого ограничения будет определена позднее.<br>";
        }
        for (let j = 0; j < k; j++) {
            if (restricts[i].sign == EQ) {
                simplex.table[i].push(new Fraction("0"))
            } else if (!NEGATIVE_BASIS || restricts[i].sign == LE) {
                if (j != index || inserted) {
                    simplex.table[i].push(new Fraction("0"));
                } else if (!inserted) {
                    simplex.table[i].push(new Fraction("1"));
                    simplex.basis.push(n + index);
                    basisHtml[simplex.basis.length - 1] = "Ограничение " + (i + 1) + " содержит неравенство, базисной будет добавленная дополнительная переменная x<sub>" + (n + index + 1) + "</sub><br>"
                    index++;
                    inserted = true;
                }
            } else if (NEGATIVE_BASIS) {
                if (j != index || inserted) {
                    simplex.table[i].push(new Fraction("0"));
                } else if (!inserted) {
                    simplex.table[i].push(new Fraction("-1"));
                    index++;
                    inserted = true;
                }
            }
        }
        simplex.b[i] = restricts[i].b;
        systemHtml += PrintFunction(simplex.table[i]) + " = " + simplex.b[i].print(printMode) + "<br>"
    }
    unknown = -1;
    for (let i = 0; i < m; i++) {
        if (simplex.basis[i] > -1) continue;
        let column = GetIdentityColumn(simplex, i);
        if (column == -1) {
            simplex.basis[i] = unknown--;
        } else {
            simplex.basis[i] = column;
            basisHtml[i] = "Столбец " + (column + 1) + " является частью единичной матрицы. Переменная x<sub>" + (column + 1) + "</sub> входит в начальный базис<br>";
        }
    }
    if (k > 0) {
        html += "Перепишем ограничения в каноническом виде:<br>"
        html += systemHtml + "<br>"
    }
    html += findHtml + basisHtml.join("") + "<br>"
    return {simplex: simplex, html: html}
}

function CheckBasis(simplex) {
    for (let i = 0; i < simplex.m; i++) if (simplex.basis[i] < 0) return false;
    return true;
}

function MakeVarBasis(simplex, row, column, print = false) {
    let html = "";
    if (simplex.basis[row] < 0) html += "В качестве базисной переменной ?<sub>" + (-simplex.basis[row]) + "</sub> берём x<sub>" + (column + 1) + "</sub>.<br>"
    else
        html += "В качестве базисной переменной x<sub>" + (simplex.basis[row] + 1) + "</sub> берём x<sub>" + (column + 1) + "</sub>.<br>"
    simplex.basis[row] = column;
    if (print) html += PrintTable(simplex, row, column);
    let x = simplex.table[row][column];
    if (!x.isOne()) html += "Делим строку " + (row + 1) + " на " + x.print(printMode) + ". ";
    let rows = []
    for (let i = 1; i <= simplex.m; i++) if (i != row + 1) rows.push(i)
    if (rows.length > 1) html += "Из строк " + rows.join(", "); else
        html += "Из строки " + rows[0]
    html += " вычитаем строку " + (row + 1) + ", умноженную на соответствующий элемент в столбце " + (column + 1) + ".<br>"
    DivRow(simplex, row, x);
    SubRows(simplex, row, column);
    return html;
}

function IsBasisVar(simplex, index) {
    for (let i = 0; i < simplex.basis.length; i++) if (index == simplex.basis[i]) return true;
    return false;
}

function IsRowZero(simplex, row) {
    if (!simplex.b[row].isZero()) return false;
    for (let j = 0; j < simplex.total; j++) if (!simplex.table[row][j].isZero()) return false;
    return true;
}

function IsColumnOne(simplex, column, row) {
    for (let i = 0; i < simplex.m; i++) {
        if (i != row && !simplex.table[i][column].isZero()) return false;
        if (i == row && !simplex.table[i][column].isOne()) return false;
    }
    return true;
}

function IsColumnBasis(simplex, column, row) {
    for (let i = 0; i < simplex.m; i++) {
        if (i != row && !simplex.table[i][column].isZero()) return false;
        if (i == row && simplex.table[i][column].isZero()) return false;
    }
    return true;
}

function GetIdentityColumn(simplex, row) {
    for (let j = 0; j < simplex.total; j++) if (IsColumnOne(simplex, j, row)) return j;
    return -1;
}

function GetBasisColumn(simplex, row) {
    for (let j = 0; j < simplex.total; j++) if (IsColumnBasis(simplex, j, row)) return j;
    return -1;
}

function RemoveZeroRow(simplex, row) {
    simplex.table.splice(row, 1);
    simplex.b.splice(row, 1);
    simplex.basis.splice(row, 1);
    simplex.basis.splice(row, 1);
    simplex.m--;
}

function FindBasis(simplex) {
    let html = "<b>Ищем базис</b><br>";
    for (let i = 0; i < simplex.basis.length; i++) {
        if (simplex.basis[i] > -1) continue;
        let column = GetBasisColumn(simplex, i);
        if (column > -1) {
            html += "В качестве базисной переменной ?<sub>" + (-simplex.basis[i]) + "</sub> берём x<sub>" + (column + 1) + "</sub>"
            html += ". Делим строку " + (i + 1) + " на " + simplex.table[i][column].print(printMode) + ".<br>"
            DivRow(simplex, i, simplex.table[i][column]);
            simplex.basis[i] = column;
        } else {
            column = 0;
            while (column < simplex.total) {
                if (IsBasisVar(simplex, column) || simplex.table[i][column].isZero()) {
                    column++;
                } else {
                    break;
                }
            }
            if (column == simplex.total) {
                if (IsRowZero(simplex, i)) {
                    html += "Условие " + (i + 1) + " линейно зависимо с другими условиями. Исключаем его из дальнейшего расмотрения.<br>";
                    RemoveZeroRow(simplex, i);
                    html += "Обновлённая симплекс-таблица:";
                    html += PrintTable(simplex);
                    i--;
                    continue;
                } else {
                    html += "<br><b>Таблица:</b>"
                    html += PrintTable(simplex);
                    return html + "<br>Обнаружено противоречивое условие. <b>Решение не существует</b>";
                }
            }
            html += MakeVarBasis(simplex, i, column, true);
        }
    }
    html += "<br><b>Таблица:</b>"
    html += PrintTable(simplex);
    html += "<br>"
    return html;
}

function MaxAbsB(simplex) {
    let imax = -1;
    for (let i = 0; i < simplex.m; i++) {
        if (!simplex.b[i].isNeg()) continue;
        if (imax == -1 || (simplex.b[i].abs().gt(simplex.b[imax].abs()))) imax = i;
    }
    return imax;
}

function MaxAbsIndex(simplex, row) {
    let jmax = -1;
    for (let j = 0; j < simplex.total; j++) {
        if (!simplex.table[row][j].isNeg()) continue;
        if (jmax == -1 || (simplex.table[row][j].abs().gt(simplex.table[row][jmax].abs()))) jmax = j;
    }
    return jmax;
}

function RemoveNegativeB(simplex) {
    let row = MaxAbsB(simplex);
    let column = MaxAbsIndex(simplex, row);
    let html = "";
    html += "Максимальное по модулю |b|<sub>max</sub> = |" + simplex.b[row].print(printMode) + "| находится в строке " + (row + 1) + ".<br>";
    if (column == -1) {
        html += "В строке " + (row + 1) + " отсутстуют отрицательные значения. Решение задачи не существует.";
        return html;
    }
    html += "Максимальный по модулю элемент в строке " + (row + 1) + " = " + simplex.table[row][column].print(printMode) + "  находится в столбце " + (column + 1) + ".<br>";
    html += MakeVarBasis(simplex, row, column);
    html += "<br><b>Обновлённая таблица:</b>";
    html += PrintTable(simplex, row, column);
    return html;
}

function HaveNegativeB(simplex) {
    for (let i = 0; i < simplex.m; i++) if (simplex.b[i].isNeg()) return true;
    return false;
}

function CheckSolveNegativeB(simplex) {
    let row = MaxAbsB(simplex);
    return MaxAbsIndex(simplex, row) > -1;
}

function CalculateDeltas(simplex) {
    for (let j = 0; j < simplex.total; j++) {
        let delta = new Fraction("0");
        for (let i = 0; i < simplex.m; i++) delta = delta.add(simplex.C[simplex.basis[i]].mult(simplex.table[i][j]));
        simplex.deltas[j] = delta.sub(simplex.C[j]);
    }
    let delta = new Fraction("0");
    for (let i = 0; i < simplex.m; i++) delta = delta.add(simplex.C[simplex.basis[i]].mult(simplex.b[i]));
    simplex.deltas[simplex.total] = delta.sub(simplex.C[simplex.total]);
}

function CalculateDeltasSolve(simplex) {
    let html = "";
    html += "&Delta;<sub>i</sub> = ";
    for (let i = 0; i < simplex.m; i++) {
        html += "C<sub>" + (1 + simplex.basis[i]) + "</sub>·a<sub>" + (i + 1) + "i</sub>";
        if (i < simplex.m - 1) html += " + ";
    }
    html += " - C<sub>i</sub><br>";
    let hint = "";
    for (let j = 0; j < simplex.total; j++) {
        let formula = "&Delta;<sub>" + (j + 1) + "</sub> = ";
        let delta = "";
        for (let i = 0; i < simplex.m; i++) {
            formula += "C<sub>" + (simplex.basis[i] + 1) + "</sub>·a<sub>" + (i + 1) + (j + 1) + "</sub>";
            delta += simplex.C[simplex.basis[i]].print(printMode) + "·" + simplex.table[i][j].printNg(printMode);
            if (i < simplex.m - 1) {
                delta += " + ";
                formula += " + ";
            }
        }
        formula += " - C<sub>" + (j + 1) + "</sub>";
        delta += " - " + simplex.C[j].print(printMode);
        delta += " = " + simplex.deltas[j].print(printMode);
        hint += formula + " = " + delta + "<br>"
    }
    let formula = "&Delta;<sub>b</sub> = ";
    let delta = "";
    for (let i = 0; i < simplex.m; i++) {
        formula += "C<sub>" + (simplex.basis[i] + 1) + "</sub>·b<sub>" + (i + 1) + "</sub>";
        delta += simplex.C[simplex.basis[i]].print(printMode) + "·" + simplex.b[i].printNg(printMode);
        if (i < simplex.m - 1) {
            delta += " + ";
            formula += " + ";
        }
    }
    formula += " - C<sub>" + (simplex.total + 1) + "</sub>";
    delta += " - " + simplex.C[simplex.total].print(printMode);
    delta += " = " + simplex.deltas[simplex.total].print(printMode);
    hint += formula + " = " + delta;
    hint = CreateScrollBlock(hint);
    html += CreateHideOpenBlock('Подробный расчёт дельт', hint)
    return html;
}

function CheckPlan(simplex) {
    for (let i = 0; i < simplex.total; i++) {
        if (simplex.mode == MAX && simplex.deltas[i].isNeg()) return false;
        if (simplex.mode == MIN && simplex.deltas[i].isPos()) return false;
    }
    return true;
}

function CheckPlanSolve(simplex) {
    let hint = CreateHideOpenBlock('Критерий оптимальности', "План оптимален, если в таблице отсутствуют " + (simplex.mode == MAX ? "отрицательные" : "положительные") + " дельты. ");
    let html = "<b>Проверяем план на оптимальность:</b> ";
    for (let i = 0; i < simplex.total; i++) {
        if (simplex.mode == MAX && simplex.deltas[i].isNeg()) {
            html += "план <b>не оптимален</b>, так как &Delta;<sub>" + (i + 1) + "</sub> = " + simplex.deltas[i].print(printMode) + " отрицательна.<br>";
            html += hint;
            return html;
        }
        if (simplex.mode == MIN && simplex.deltas[i].isPos()) {
            html += "план <b>не оптимален</b>, так как &Delta;<sub>" + (i + 1) + "</sub> = " + simplex.deltas[i].print(printMode) + " положительна.<br>";
            html += hint;
            return html;
        }
    }
    html += (simplex.mode == MAX ? "отрицательные" : "положительные") + " дельты отсутствуют, следовательно <b>план оптимален</b>.<br>"
    html += hint;
    return html;
}

function GetColumn(simplex) {
    let jmax = 0;
    for (let j = 1; j < simplex.total; j++) {
        if (simplex.mode == MAX && simplex.deltas[j].lt(simplex.deltas[jmax])) jmax = j; else if (simplex.mode == MIN && simplex.deltas[j].gt(simplex.deltas[jmax])) jmax = j;
    }
    return jmax;
}

function GetQandRow(simplex, j) {
    let imin = -1;
    for (let i = 0; i < simplex.m; i++) {
        simplex.Q[i] = null;
        if (simplex.table[i][j].isZero()) continue;
        let q = simplex.b[i].div(simplex.table[i][j]);
        if (q.isNeg() || (simplex.b[i].isZero() && simplex.table[i][j].isNeg())) continue;
        simplex.Q[i] = q;
        if (imin == -1 || q.lt(simplex.Q[imin])) imin = i;
    }
    return imin;
}

function DivRow(simplex, row, value) {
    for (let j = 0; j < simplex.total; j++) simplex.table[row][j] = simplex.table[row][j].div(value);
    simplex.b[row] = simplex.b[row].div(value);
}

function SubRow(simplex, row1, row2, value) {
    for (let j = 0; j < simplex.total; j++) simplex.table[row1][j] = simplex.table[row1][j].sub(simplex.table[row2][j].mult(value));
    simplex.b[row1] = simplex.b[row1].sub(simplex.b[row2].mult(value));
}

function SubRows(simplex, row, column) {
    for (let i = 0; i < simplex.m; i++) {
        if (i == row) continue;
        SubRow(simplex, i, row, simplex.table[i][column])
    }
}

function CalcFunction(simplex) {
    let F = new Fraction()
    let X = [];
    let html = "";
    for (let i = 0; i < simplex.m; i++) F = F.add(simplex.C[simplex.basis[i]].mult(simplex.b[i]));
    for (let i = 0; i < simplex.total; i++) {
        html += simplex.C[i].print(printMode) + "·";
        let index = simplex.basis.indexOf(i);
        if (index == -1) {
            html += "0 ";
            X.push("0");
        } else {
            html += simplex.b[index].printNg(printMode) + " ";
            X.push(simplex.b[index].print(printMode))
        }
        if (i < simplex.total - 1) html += "+ ";
    }
    return {result: F, plan: "[ " + X.join(", ") + " ]", solve: html}
}

function PrintTable(simplex, row = -1, col = -1) {
    let html = "<br>";
    let n = simplex.n;
    html += "<table class='simplex-table'>"
    html += "<tr><td><b>C</b></td>";
    for (let i = 0; i < simplex.C.length; i++) html += "<td>" + simplex.C[i].print(printMode) + "</td>";
    html += "</tr>"
    html += "<tr><th>базис</th>"
    for (let i = 0; i < simplex.total; i++) html += "<th>x<sub>" + (i + 1) + "</sub></th>";
    html += "<th>b</th>"
    if (simplex.Q.length > 0) html += "<th>Q</th>";
    html += "</tr>"
    for (let i = 0; i < simplex.m; i++) {
        if (simplex.basis[i] < 0) html += "<tr><td><b>?<sub>" + (-simplex.basis[i]) + "</sub></b></td>"
        else
            html += "<tr><td><b>x<sub>" + (1 + simplex.basis[i]) + "</sub></b></td>"
        for (let j = 0; j < simplex.table[i].length; j++) {
            if (i == row && j == col) html += "<td class='row-col-cell'>"; else if (i == row) html += "<td class='row-cell'>"; else if (j == col) html += "<td class='col-cell'>"; else
                html += "<td>";
            html += simplex.table[i][j].print(printMode);
            html += "</td>";
        }
        if (i == row) html += "<td class='row-cell'>"; else
            html += "<td>";
        html += simplex.b[i].print(printMode) + "</td>";
        if (simplex.Q.length > 0) {
            if (simplex.Q[i] == null) html += "<td>-</td>"; else if (col != -1) {
                html += "<td" + (i == row ? " class='row-cell'" : "") + ">" + simplex.b[i].print(printMode) + " / " + simplex.table[i][col].print(printMode) + " = " + simplex.Q[i].print(printMode) + "</td>";
            } else {
                html += "<td>" + simplex.Q[i].print(printMode) + "</td>";
            }
        }
        html += "</tr>";
    }
    if (simplex.deltas.length > 0) {
        html += "<tr><td><b>&Delta;</b></td>";
        for (let i = 0; i < simplex.deltas.length; i++) html += "<td>" + simplex.deltas[i].print(printMode) + "</td>";
        html += "</tr>"
    }
    html += "</table>";
    html += "<br>"
    return html;
}

function PrintAnswer(simplex) {
    let answer = "";
    for (let i = 0; i < simplex.n; i++) {
        let index = simplex.basis.indexOf(i);
        answer += "x<sub>" + (i + 1) + "</sub> = ";
        if (index == -1) answer += "0, "; else
            answer += simplex.b[index].print(printMode) + ", ";
    }
    let F = new Fraction();
    for (let i = 0; i < simplex.m; i++) F = F.add(simplex.C[simplex.basis[i]].mult(simplex.b[i]));
    answer += "F = " + F.print(printMode);
    return answer
}

function InputToString(func, mode, restrictions) {
    let s = "f: ";
    for (let i = 0; i < func.length; i++) s += func[i].toString() + " ";
    s += mode + " ";
    for (let i = 0; i < restrictions.length; i++) {
        s += ", rest " + (i + 1) + ": [";
        for (let j = 0; j < restrictions[i].values.length; j++) {
            s += restrictions[i].values[j].toString() + " ";
        }
        s += restrictions[i].sign + " " + restrictions[i].b.toString() + "]";
    }
    return s;
}

function SolveTable(n, m, func, restricts, mode) {
    let html = ""
    if (!NEGATIVE_BASIS) html += ChangeSigns(restricts);
    let init = PrepareTable(n, m, func, restricts, mode)
    html += init.html
    let simplex = init.simplex
    html += "<b>Начальная симплекс-таблица</b>";
    html += PrintTable(simplex);
    let res = true;
    if (!CheckBasis(simplex)) html += FindBasis(simplex);
    if (!CheckBasis(simplex)) {
        return {answer: "Решение задачи не существует.", solve: html}
    }
    while (HaveNegativeB(simplex) && res) {
        html += "В столбце b присутствуют отрицательные значения.<br>"
        res = CheckSolveNegativeB(simplex);
        html += RemoveNegativeB(simplex);
    }
    if (!res) {
        return {answer: "Решение задачи не существует.", solve: html}
    }
    CalculateDeltas(simplex);
    html += "<b>Вычисляем дельты:</b> ";
    html += CalculateDeltasSolve(simplex);
    html += "<b>Симплекс-таблица с дельтами</b>";
    html += PrintTable(simplex);
    let iteration = 1;
    html += CheckPlanSolve(simplex);
    while (!CheckPlan(simplex)) {
        html += "<h3>Итерация " + iteration + "</h3>"
        let column = GetColumn(simplex);
        html += "Определяем <i>разрешающий столбец</i> - столбец, в котором находится ";
        html += (simplex.mode == MAX ? "минимальная" : "максимальная") + " дельта: ";
        html += (column + 1) + ", &Delta;<sub>" + (column + 1) + "</sub>: " + simplex.deltas[column].print(printMode) + "<br>";
        html += "Находим симплекс-отношения Q, путём деления коэффициентов b на соответствующие значения столбца " + (column + 1) + "<br>"
        let row = GetQandRow(simplex, column);
        if (row == -1) {
            html += PrintTable(simplex, -1, column);
            html += "Все значения столбца " + (column + 1) + " неположительны.<br>";
            html += "<b>Функция не ограничена. Оптимальное решение отсутствует</b>.<br>";
            return {answer: "Функция не ограничена. Оптимальное решение отсутствует.", solve: html}
        }
        html += "В найденном столбце ищем строку с наименьшим значением Q: Q<sub>min</sub> = " + simplex.Q[row].print(printMode) + ", строка " + (row + 1) + ".<br>";
        html += "На пересечении найденных строки и столбца находится <i>разрешающий элемент</i>: " + simplex.table[row][column].print(printMode) + "<br>";
        html += MakeVarBasis(simplex, row, column, true);
        CalculateDeltas(simplex);
        html += "<b>Вычисляем новые дельты:</b> ";
        html += CalculateDeltasSolve(simplex);
        html += "<b>Симплекс-таблица с обновлёнными дельтами</b>";
        html += PrintTable(simplex);
        let F = CalcFunction(simplex);
        html += "<b>Текущий план X:</b> " + F.plan + "<br>";
        html += "<b>Целевая функция F:</b> " + F.solve + " = " + F.result.print(printMode) + "<br>";
        iteration++;
        html += CheckPlanSolve(simplex);
    }
    if (HaveNegativeB(simplex)) {
        html += "В столбце b присутствуют отрицательные значения. Решения не существует.";
        return {
            answer: "В столбце b присутствуют отрицательные значения. Решения не существует.",
            solve: html
        }
    }
    html += "<b>Ответ:</b> ";
    let answer = PrintAnswer(simplex)
    return {answer: answer, solve: html + answer + "<br>"}
}

function PrintAM(C, brackets = false) {
    if (C.a.isZero() && C.m.isZero()) return "0"
    if (brackets) {
        if (C.a.isZero()) {
            if (C.m.abs().isOne()) return C.m.isPos() ? "M" : "- M";
            return (C.m.isPos() ? C.m.print(printMode) : "- " + C.m.abs().print(printMode)) + "M";
        }
    }
    if (C.a.isZero()) {
        if (C.m.abs().isOne()) return C.m.isPos() ? "M" : "-M";
        return C.m.print(printMode) + "M";
    }
    if (C.m.isZero()) return C.a.print(printMode);
    let html = C.a.print(printMode);
    if (brackets) html += "(";
    if (C.m.isNeg()) html += " - "; else
        html += " + ";
    if (C.m.abs().isOne()) html += "M"; else
        html += C.m.abs().print(printMode) + "M";
    if (brackets) html += ")"
    return html;
}

function AddAM(v1, v2) {
    let a = v1.a.add(v2.a);
    let m = v1.m.add(v2.m);
    return {a: a, m: m}
}

function SubAM(v1, v2) {
    let a = v1.a.sub(v2.a);
    let m = v1.m.sub(v2.m);
    return {a: a, m: m}
}

function MultAM(v, x) {
    let a = v.a.mult(x);
    let m = v.m.mult(x);
    return {a: a, m: m}
}

function LessAM(v1, v2) {
    if (!v1.m.eq(v2.m)) return v1.m.lt(v2.m);
    return v1.a.lt(v2.a);
}

function GreaterAM(v1, v2) {
    if (!v1.m.eq(v2.m)) return v1.m.gt(v2.m);
    return v1.a.gt(v2.a);
}

function IsPosAM(v) {
    if (!v.m.isZero()) return v.m.isPos();
    return v.a.isPos();
}

function IsNegAM(v) {
    if (!v.m.isZero()) return v.m.isNeg();
    return v.a.isNeg();
}

function IsZeroAM(v) {
    return v.a.isZero() && v.m.isZero();
}

function ChangeSignsArtificialBasis(restricts) {
    let html = "<b>Меняем знаки у ограничений с отрицательными свободными коэффициентами, путём умножения на -1:</b><br>";
    let have = false;
    for (let i = 0; i < restricts.length; i++) {
        if (restricts[i].b.isNeg()) {
            if (restricts[i].sign == GE) {
                restricts[i].sign = LE;
            } else if (restricts[i].sign == LE) {
                restricts[i].sign = GE;
            }
            for (let j = 0; j < restricts[i].values.length; j++) restricts[i].values[j].changeSign()
            restricts[i].b.changeSign()
            have = true;
        }
        html += PrintFunction(restricts[i].values);
        html += " " + restricts[i].sign + " "
        html += restricts[i].b.print(printMode);
        html += "<br>"
    }
    html += "<br>"
    return have ? html : "";
}

function PrintTableArtificialBasis(simplex, row = -1, col = -1) {
    let html = "<br>";
    let n = simplex.n;
    html += "<table class='simplex-table'>"
    html += "<tr><td><b>C</b></td>";
    for (let i = 0; i < simplex.C.length; i++) {
        html += "<td>" + PrintAM(simplex.C[i]) + "</td>";
    }
    html += "</tr>"
    html += "<tr><th>базис</th>"
    for (let i = 0; i < simplex.total; i++) {
        if (i < simplex.total - simplex.avars.length) {
            html += "<th>x<sub>" + (i + 1) + "</sub></th>";
        } else {
            html += "<th>u<sub>" + (i + 1 - simplex.total + simplex.avars.length) + "</sub></th>";
        }
    }
    html += "<th>b</th>"
    if (simplex.Q.length > 0) html += "<th>Q</th>";
    html += "</tr>"
    for (let i = 0; i < simplex.m; i++) {
        if (simplex.basis[i] < 0) html += "<tr><td><b>?<sub>" + (-simplex.basis[i]) + "</sub></b></td>"
        else if (simplex.basis[i] >= simplex.total - simplex.avars.length) html += "<tr><td><b>u<sub>" + (1 + simplex.basis[i] - simplex.total + simplex.avars.length) + "</sub></b></td>"
        else
            html += "<tr><td><b>x<sub>" + (1 + simplex.basis[i]) + "</sub></b></td>"
        for (let j = 0; j < simplex.table[i].length; j++) {
            if (i == row && j == col) html += "<td class='row-col-cell'>"; else if (i == row) html += "<td class='row-cell'>"; else if (j == col) html += "<td class='col-cell'>"; else
                html += "<td>";
            html += simplex.table[i][j].print(printMode);
            html += "</td>";
        }
        if (i == row) html += "<td class='row-cell'>"; else
            html += "<td>";
        html += simplex.b[i].print(printMode) + "</td>";
        if (simplex.Q.length > 0) {
            if (simplex.Q[i] == null) html += "<td>-</td>"; else if (col != -1) {
                html += "<td" + (i == row ? " class='row-cell'" : "") + ">" + simplex.b[i].print(printMode) + " / " + simplex.table[i][col].print(printMode) + " = " + simplex.Q[i].print(printMode) + "</td>";
            } else {
                html += "<td>" + simplex.Q[i].print(printMode) + "</td>";
            }
        }
        html += "</tr>";
    }
    if (simplex.deltas.length > 0) {
        html += "<tr><td><b>&Delta;</b></td>";
        for (let i = 0; i < simplex.deltas.length; i++) html += "<td>" + PrintAM(simplex.deltas[i]) + "</td>";
        html += "</tr>"
    }
    html += "</table>";
    html += "<br>"
    return html;
}

function CalculateDeltasArtificialBasis(simplex) {
    for (let j = 0; j < simplex.total; j++) {
        let delta = {a: new Fraction("0"), m: new Fraction("0")}
        for (let i = 0; i < simplex.m; i++) delta = AddAM(delta, MultAM(simplex.C[simplex.basis[i]], simplex.table[i][j]));
        simplex.deltas[j] = SubAM(delta, simplex.C[j]);
    }
    let delta = {a: new Fraction("0"), m: new Fraction("0")}
    for (let i = 0; i < simplex.m; i++) delta = AddAM(delta, MultAM(simplex.C[simplex.basis[i]], simplex.b[i]));
    simplex.deltas[simplex.total] = SubAM(delta, simplex.C[simplex.total]);
}

function CalculateDeltasArtificialBasisSolve(simplex) {
    let html = "";
    html += "&Delta;<sub>i</sub> = ";
    for (let i = 0; i < simplex.m; i++) {
        html += "C<sub>" + (1 + simplex.basis[i]) + "</sub>·a<sub>" + (i + 1) + "i</sub>";
        if (i < simplex.m - 1) html += " + ";
    }
    html += " - C<sub>i</sub><br>";
    let hint = "";
    for (let j = 0; j < simplex.total; j++) {
        let formula = "&Delta;<sub>" + (j + 1) + "</sub> = ";
        let delta = "";
        for (let i = 0; i < simplex.m; i++) {
            formula += "C<sub>" + (simplex.basis[i] + 1) + "</sub>·a<sub>" + (i + 1) + (j + 1) + "</sub>";
            delta += PrintAM(simplex.C[simplex.basis[i]]) + "·" + simplex.table[i][j].printNg(printMode);
            if (i < simplex.m - 1) {
                delta += " + ";
                formula += " + ";
            }
        }
        formula += " - C<sub>" + (j + 1) + "</sub>";
        delta += " - " + PrintAM(simplex.C[j]);
        delta += " = " + PrintAM(simplex.deltas[j]);
        hint += formula + " = " + delta + "<br>"
    }
    let formula = "&Delta;<sub>b</sub> = ";
    let delta = "";
    for (let i = 0; i < simplex.m; i++) {
        formula += "C<sub>" + (simplex.basis[i] + 1) + "</sub>·b<sub>" + (i + 1) + "</sub>";
        delta += PrintAM(simplex.C[simplex.basis[i]]) + "·" + simplex.b[i].printNg(printMode);
        if (i < simplex.m - 1) {
            delta += " + ";
            formula += " + ";
        }
    }
    formula += " - C<sub>" + (simplex.total + 1) + "</sub>";
    delta += " - " + PrintAM(simplex.C[simplex.total]);
    delta += " = " + PrintAM(simplex.deltas[simplex.total]);
    hint += formula + " = " + delta;
    hint = CreateScrollBlock(hint);
    html += CreateHideOpenBlock('Подробный расчёт дельт', hint)
    return html;
}

function PrepareArtificialBasis(n, m, func, restricts, mode) {
    let k = 0;
    for (let i = 0; i < restricts.length; i++) if (restricts[i].sign != EQ) k++;
    let html = "";
    if (k > 2) {
        html += "Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>" + (n + 1) + "</sub>..x<sub>" + (n + k) + "</sub>.<br>"
    } else if (k == 2) {
        html += "Для каждого ограничения с неравенством <b>добавляем дополнительные переменные</b> x<sub>" + (n + 1) + "</sub> и x<sub>" + (n + k) + "</sub>.<br>"
    } else if (k == 1) {
        html += "Для ограничения с неравенством <b>добавляем дополнительную переменную</b> x<sub>" + (n + 1) + "</sub>.<br>"
    }
    let simplex = {
        n: n,
        m: m,
        total: n + k,
        mode: mode,
        table: [],
        b: [],
        basis: [],
        avars: [],
        C: [],
        deltas: [],
        Q: []
    }
    let unknown = -1;
    let index = 0;
    let basisHtml = []
    for (let i = 0; i < m; i++) {
        simplex.table[i] = []
        for (let j = 0; j < n; j++) simplex.table[i].push(restricts[i].values[j]);
        let inserted = false;
        if (restricts[i].sign == EQ) {
            simplex.basis.push(unknown);
            unknown--;
            basisHtml[simplex.basis.length - 1] = "Ограничение " + (i + 1) + " содержит равенство. Базисная переменная для этого ограничения будет определена позднее.<br>";
        } else if (restricts[i].sign == GE) {
            simplex.basis.push(unknown);
            unknown--;
            basisHtml[simplex.basis.length - 1] = "Ограничение " + (i + 1) + " содержит неравенство с " + GE + ". Базисная переменная для этого ограничения будет определена позднее.<br>";
        }
        for (let j = 0; j < k; j++) {
            if (restricts[i].sign == EQ) {
                simplex.table[i].push(new Fraction("0"))
            } else if (restricts[i].sign == LE) {
                if (j != index || inserted) {
                    simplex.table[i].push(new Fraction("0"));
                } else if (!inserted) {
                    simplex.table[i].push(new Fraction("1"));
                    simplex.basis.push(n + index);
                    basisHtml[simplex.basis.length - 1] = "Ограничение " + (i + 1) + " содержит неравенство, базисной будет добавленная дополнительная переменная x<sub>" + (n + index + 1) + "</sub><br>"
                    index++;
                    inserted = true;
                }
            } else {
                if (j != index || inserted) {
                    simplex.table[i].push(new Fraction("0"));
                } else if (!inserted) {
                    simplex.table[i].push(new Fraction("-1"));
                    index++;
                    inserted = true;
                }
            }
        }
        simplex.b[i] = restricts[i].b;
    }
    unknown = 0;
    for (let i = 0; i < m; i++) {
        if (simplex.basis[i] >= 0) continue;
        let column = GetIdentityColumn(simplex, i);
        if (column != -1) {
            simplex.basis[i] = column;
            basisHtml[i] = "Столбец " + (column + 1) + " является частью единичной матрицы. Переменная x<sub>" + (column + 1) + "</sub> входит в начальный базис<br>";
        } else {
            unknown++;
        }
    }
    for (let i = 0; i < n; i++) {
        simplex.C.push({a: func[i], m: new Fraction("0")})
    }
    for (let i = 0; i < k; i++) {
        simplex.C.push({a: new Fraction("0"), m: new Fraction("0")})
    }
    simplex.C.push({a: new Fraction("0"), m: new Fraction("0")})
    html += basisHtml.join("");
    html += "<br><b>Начальная симплекс-таблица</b>"
    html += PrintTableArtificialBasis(simplex);
    simplex.total += unknown;
    if (unknown == 0) {
        html += "Так как были найдены все базисные переменные, то нет необходимости добавления искусственных переменных.<br><br>";
    } else {
        for (let i = 0; i < unknown; i++) {
            simplex.avars.push(i);
            for (let j = 0; j < m; j++) simplex.table[j].push(new Fraction("0"));
        }
        index = 0;
        for (let i = 0; i < m; i++) {
            if (simplex.basis[i] >= 0) continue;
            html += "Для ограничения " + (i + 1) + " добавляем искусственную переменную u<sub>" + (index + 1) + "</sub> и делаем её базисной.<br>";
            simplex.table[i][n + k + index] = new Fraction("1");
            simplex.basis[i] = n + k + index;
            index++;
        }
        simplex.C.pop();
        for (let i = 0; i < unknown; i++) {
            simplex.C.push({a: new Fraction("0"), m: new Fraction(mode == MIN ? "1" : "-1")})
        }
        simplex.C.push({a: new Fraction("0"), m: new Fraction("0")})
        html += "В целевую функцию добавляем искусственные пременные с коэффициентом " + (mode == MAX ? "-M" : "M") + ", где M — очень большое число.<br>";
        html += "<br><b>Таблица с искусственными переменными</b>"
        html += PrintTableArtificialBasis(simplex);
        html += "<b>Перепишем условие задачи с учётом добавленных искусственных переменных:</b><br>"
        html += "F = ";
        let printed = false;
        for (let i = 0; i < simplex.total; i++) {
            if (IsZeroAM(simplex.C[i])) continue;
            if (printed) {
                if (simplex.C[i].a.isZero()) html += simplex.C[i].m.isPos() ? " + " : " "; else if (simplex.C[i].m.isZero()) html += simplex.C[i].a.isPos() ? " + " : " "; else
                    html += " + "
            }
            html += PrintAM(simplex.C[i], true)
            printed = true
            if (i < simplex.total - simplex.avars.length) {
                html += "x<sub>" + (i + 1) + "</sub>";
            } else {
                html += "u<sub>" + (i + 1 - simplex.total + simplex.avars.length) + "</sub>";
            }
        }
        html += " &rarr; " + mode + "<br>"
        for (let i = 0; i < m; i++) {
            printed = false;
            for (let j = 0; j < simplex.total; j++) {
                if (simplex.table[i][j].isZero()) continue;
                if (printed && simplex.table[i][j].isPos()) html += "+ ";
                if (simplex.table[i][j].isNeg()) {
                    if (simplex.table[i][j].abs().isOne()) html += "- "; else
                        html += "- " + simplex.table[i][j].abs().print(printMode) + "·";
                } else {
                    if (!simplex.table[i][j].isOne()) html += simplex.table[i][j].print(printMode) + "·";
                }
                printed = true
                if (j < simplex.total - simplex.avars.length) {
                    html += "x<sub>" + (j + 1) + "</sub> ";
                } else {
                    html += "u<sub>" + (j + 1 - simplex.total + simplex.avars.length) + "</sub> ";
                }
            }
            html += "= " + simplex.b[i].print(printMode) + "<br>";
        }
        html += "<br><b>Выразим искусственные переменные через базовые" + (k > 0 ? " и дополнительные" : "") + ":</b><br>"
        for (let i = 0; i < m; i++) {
            if (simplex.basis[i] < simplex.total - simplex.avars.length) continue;
            html += "u<sub>" + (1 + simplex.basis[i] - simplex.total + simplex.avars.length) + "</sub> = " + simplex.b[i].print(printMode);
            for (let j = 0; j < n + k; j++) {
                if (simplex.table[i][j].isZero()) continue;
                if (simplex.table[i][j].isNeg()) {
                    html += " + ";
                } else {
                    html += " - ";
                }
                if (!simplex.table[i][j].abs().isOne()) html += simplex.table[i][j].abs().print(printMode) + "·";
                html += "x<sub>" + (j + 1) + "</sub>";
            }
            html += "<br>"
        }
        html += "<br>";
    }
    return {simplex: simplex, html: html}
}

function CheckPlanArtificialBasis(simplex) {
    for (let i = 0; i < simplex.total; i++) {
        if (simplex.mode == MAX && IsNegAM(simplex.deltas[i])) return false;
        if (simplex.mode == MIN && IsPosAM(simplex.deltas[i])) return false;
    }
    return true;
}

function CheckPlanArtificialBasisSolve(simplex) {
    let hint = CreateHideOpenBlock('Критерий оптимальности', "План оптимален, если в таблице отсутствуют " + (simplex.mode == MAX ? "отрицательные" : "положительные") + " дельты. ");
    let html = "<b>Проверяем план на оптимальность:</b> ";
    for (let i = 0; i < simplex.total; i++) {
        if (simplex.mode == MAX && IsNegAM(simplex.deltas[i])) {
            html += "план <b>не оптимален</b>, так как &Delta;<sub>" + (i + 1) + "</sub> = " + PrintAM(simplex.deltas[i]) + " отрицательна.<br>";
            html += hint;
            return html;
        }
        if (simplex.mode == MIN && IsPosAM(simplex.deltas[i])) {
            html += "план <b>не оптимален</b>, так как &Delta;<sub>" + (i + 1) + "</sub> = " + PrintAM(simplex.deltas[i]) + " положительна.<br>";
            html += hint;
            return html;
        }
    }
    html += (simplex.mode == MAX ? "отрицательные" : "положительные") + " дельты отсутствуют, следовательно <b>план оптимален</b>.<br>"
    html += hint;
    return html;
}

function GetQandRowArtificialBasis(simplex, j) {
    let imin = -1;
    let imina = -1;
    for (let i = 0; i < simplex.m; i++) {
        simplex.Q[i] = null;
        if (simplex.table[i][j].isZero()) continue;
        let q = simplex.b[i].div(simplex.table[i][j]);
        if (q.isNeg() || (simplex.b[i].isZero() && simplex.table[i][j].isNeg())) continue;
        simplex.Q[i] = q;
        if (simplex.basis[i] >= simplex.total - simplex.avars.length) {
            if (imina == -1 || q.lt(simplex.Q[imina])) imina = i;
        }
        if (imin == -1 || q.lt(simplex.Q[imin])) imin = i;
    }
    return imina == -1 ? imin : simplex.Q[imina].lt(simplex.Q[imin]) ? imina : imin;
}

function GetColumnArtificialBasis(simplex) {
    let jmax = 0;
    for (let j = 1; j < simplex.total; j++) {
        if (simplex.mode == MAX && LessAM(simplex.deltas[j], simplex.deltas[jmax])) jmax = j; else if (simplex.mode == MIN && GreaterAM(simplex.deltas[j], simplex.deltas[jmax])) jmax = j;
    }
    return jmax;
}

function MakeVarBasisArtificial(simplex, row, column, print = false) {
    let html = "";
    if (simplex.basis[row] >= simplex.total - simplex.avars.length) html += "В качестве базисной переменной u<sub>" + (1 + simplex.basis[row] - simplex.total + simplex.avars.length) + "</sub> берём x<sub>" + (column + 1) + "</sub>.<br>"
    else
        html += "В качестве базисной переменной x<sub>" + (simplex.basis[row] + 1) + "</sub> берём x<sub>" + (column + 1) + "</sub>.<br>"
    simplex.basis[row] = column;
    if (print) html += PrintTableArtificialBasis(simplex, row, column);
    let x = simplex.table[row][column];
    if (!x.isOne()) html += "Делим строку " + (row + 1) + " на " + x.print(printMode) + ". ";
    let rows = []
    for (let i = 1; i <= simplex.m; i++) if (i != row + 1) rows.push(i)
    if (rows.length > 1) html += "Из строк " + rows.join(", "); else
        html += "Из строки " + rows[0]
    html += " вычитаем строку " + (row + 1) + ", умноженную на соответствующий элемент в столбце " + (column + 1) + ".<br>"
    DivRow(simplex, row, x);
    SubRows(simplex, row, column);
    return html;
}

function CalcFunctionArtificialBasis(simplex) {
    let F = {a: new Fraction("0"), m: new Fraction("0")}
    let X = [];
    let html = "";
    for (let i = 0; i < simplex.m; i++) F = AddAM(F, MultAM(simplex.C[simplex.basis[i]], simplex.b[i]));
    for (let i = 0; i < simplex.total; i++) {
        html += PrintAM(simplex.C[i]) + "·";
        let index = simplex.basis.indexOf(i);
        if (index == -1) {
            html += "0 ";
            X.push("0");
        } else {
            html += simplex.b[index].printNg(printMode) + " ";
            X.push(simplex.b[index].print(printMode))
        }
        if (i < simplex.total - 1) html += "+ ";
    }
    return {result: F, plan: "[ " + X.join(", ") + " ]", solve: html}
}

function PrintAnswerArtificialBasis(simplex) {
    let answer = "";
    for (let i = 0; i < simplex.n; i++) {
        let index = simplex.basis.indexOf(i);
        answer += "x<sub>" + (i + 1) + "</sub> = ";
        if (index == -1) answer += "0, "; else
            answer += simplex.b[index].print(printMode) + ", ";
    }
    let F = {a: new Fraction("0"), m: new Fraction("0")};
    for (let i = 0; i < simplex.m; i++) F = AddAM(F, MultAM(simplex.C[simplex.basis[i]], simplex.b[i]));
    answer += "F = " + PrintAM(F);
    return answer
}

function HaveArtificialBasis(simplex, zero = true) {
    for (let i = 0; i < simplex.basis.length; i++) if (simplex.basis[i] >= simplex.total - simplex.avars.length && (!zero || !simplex.b[i].isZero())) return true;
    return false;
}

function SolveArtificialBasis(n, m, func, restricts, mode) {
    let html = "";
    html += ChangeSignsArtificialBasis(restricts);
    let init = PrepareArtificialBasis(n, m, func, restricts, mode)
    let simplex = init.simplex;
    html += init.html;
    CalculateDeltasArtificialBasis(simplex);
    html += "<b>Вычисляем дельты:</b> ";
    html += CalculateDeltasArtificialBasisSolve(simplex);
    html += "<b>Симплекс-таблица с дельтами</b>";
    html += PrintTableArtificialBasis(simplex)
    let iteration = 1;
    let F = CalcFunctionArtificialBasis(simplex);
    html += "<b>Текущий план X:</b> " + F.plan + "<br>";
    html += "<b>Целевая функция F:</b> " + F.solve + " = " + PrintAM(F.result) + "<br>";
    html += CheckPlanArtificialBasisSolve(simplex);
    while (!CheckPlanArtificialBasis(simplex)) {
        html += "<h3>Итерация " + iteration + "</h3>"
        let column = GetColumnArtificialBasis(simplex);
        html += "Определяем <i>разрешающий столбец</i> - столбец, в котором находится ";
        html += (simplex.mode == MAX ? "минимальная" : "максимальная") + " дельта: ";
        html += (column + 1) + ", &Delta;<sub>" + (column + 1) + "</sub>: " + PrintAM(simplex.deltas[column]) + "<br>";
        html += "Находим симплекс-отношения Q, путём деления коэффициентов b на соответствующие значения столбца " + (column + 1) + "<br>"
        let row = GetQandRowArtificialBasis(simplex, column);
        if (row == -1) {
            html += PrintTableArtificialBasis(simplex, -1, column);
            html += "Все значения столбца " + (column + 1) + " неположительны.<br>";
            html += "<b>Функция не ограничена. Оптимальное решение отсутствует</b>.<br>";
            return {answer: "Функция не ограничена. Оптимальное решение отсутствует.", solve: html}
        }
        html += "В найденном столбце ищем строку с наименьшим значением Q: Q<sub>min</sub> = " + simplex.Q[row].print(printMode) + ", строка " + (row + 1) + ".<br>";
        html += "На пересечении найденных строки и столбца находится <i>разрешающий элемент</i>: " + simplex.table[row][column].print(printMode) + "<br>";
        html += MakeVarBasisArtificial(simplex, row, column, true);
        CalculateDeltasArtificialBasis(simplex);
        html += "<b>Вычисляем новые дельты:</b> ";
        html += CalculateDeltasArtificialBasisSolve(simplex);
        html += "<b>Симплекс-таблица с обновлёнными дельтами</b>";
        html += PrintTableArtificialBasis(simplex);
        let F = CalcFunctionArtificialBasis(simplex);
        html += "<b>Текущий план X:</b> " + F.plan + "<br>";
        html += "<b>Целевая функция F:</b> " + F.solve + " = " + PrintAM(F.result) + "<br>";
        iteration++;
        html += CheckPlanArtificialBasisSolve(simplex);
    }
    if (HaveArtificialBasis(simplex)) {
        html += "Так как в оптимальном решении пристуствуют искусственные переменные, то задача не имеет допустимого решения.";
        return {answer: "Задача не имеет допустимого решения.", solve: html}
    }
    if (HaveNegativeB(simplex)) {
        html += "В столбце b присутствуют отрицательные значения. Решения не существует.";
        return {answer: "Решения не существует.", solve: html}
    }
    if (HaveArtificialBasis(simplex, false)) {
        html += "Искусственные переменные остались базисными, однако свободный коэффициент при них равен нулю.<br>";
    }
    html += "<b>Ответ:</b> ";
    let answer = PrintAnswerArtificialBasis(simplex)
    return {answer: answer, solve: html + answer + "<br>"}
}

function Solve() {
    if (NEED_LOGS) $.ajax({
        url: "https://programforyou.ru/statistics/calc_statistics.shtml",
        async: true,
        success: function (result) {
            $("#stat-value").html(result);
        }
    });
    try {
        let n = +varsBox.value
        let m = +restrBox.value
        let mode = modeBox.value
        let func = GetFunctionCoefficients(n)
        let restricts = GetRestrictCoefficients(n, m);
        printMode = asFraqtions.checked ? 1 : 2
        solveBox.innerHTML = "<h3>Введённые данные</h3>";
        solveBox.innerHTML += "<div class='scroll-block'>";
        solveBox.innerHTML += PrintFunction(func);
        solveBox.innerHTML += "&rarr; " + mode
        solveBox.innerHTML += "<br>";
        for (let i = 0; i < m; i++) {
            solveBox.innerHTML += PrintFunction(restricts[i].values);
            solveBox.innerHTML += " " + restricts[i].sign + " "
            solveBox.innerHTML += restricts[i].b.print(printMode);
            solveBox.innerHTML += "<br>"
        }
        solveBox.innerHTML += "</div>"
        let result;
        if (withSolveBox.checked) {
            if (solveType.value == "1") {
                result = SolveTable(n, m, func, restricts, mode);
                solveBox.innerHTML += "<h3>Ответ</h3>" + CreateScrollBlock(result.answer);
                solveBox.innerHTML += "<h3>Решение базовым симплекс-методом</h3> " + result.solve;
            } else {
                result = SolveArtificialBasis(n, m, func, restricts, mode);
                solveBox.innerHTML += "<h3>Ответ</h3>" + CreateScrollBlock(result.answer);
                solveBox.innerHTML += "<h3>Решение методом искусственного базиса</h3> " + result.solve
            }
        } else {
            result = SolveTable(n, m, func, restricts, mode);
            solveBox.innerHTML += "<h3>Ответ</h3>" + CreateScrollBlock(result.answer);
        }
        updateScrollblocks()
        scrollTo('#simplex-solve')
        console.log(InputToString(func, mode, restricts));
        console.log(result.answer.replace(/\<sub\>/gi, "").replace(/\<\/sub\>/gi, ""));
        if (NEED_LOGS) {
            $.ajax({
                url: "https://programforyou.ru/statistics/getStat.shtml?" + "file=calculators//simplex.txt" + "&clicks=" + $("#stat-value").text() + "&type=" + (solveType.value == "1" ? "usual" : "basis") + "&function=" + InputToString(func, mode, restricts) + "&result=" + result.answer.replace(/\<sub\>/gi, "").replace(/\<\/sub\>/gi, ""),
                async: true
            });
        }
    } catch (e) {
        alert("Ошибка: " + e);
    }
    updateHideOpenBlock()
}

function GenerateSimples() {
    let calc = document.getElementsByClassName('simplex')[0]
    calc.appendChild(document.createElement("hr"))
    for (let i = 1; i <= 7; i++) {
        let input = document.createElement('div')
        input.innerHTML = "Пример " + i
        input.className = 'simplex-btn'
        input.style.marginRight = '5px'
        input.style.fontSize = "8pt"
        input.onclick = function () {
            SetInitValues(i);
            Solve()
        };
        calc.appendChild(input)
    }
}

function MakeDual() {
    let n = +varsBox.value
    let m = +restrBox.value
    let mode = modeBox.value == MAX ? MIN : MAX
    let func = GetFunctionCoefficients(n)
    let restricts = GetRestrictCoefficients(n, m);
    for (let i = 0; i < m; i++) {
        if (restricts[i].sign == EQ) {
            alert("Невозможно сделать двойственной задачу, содержащую ограничения с равенством");
            return;
        }
    }
    SetSizes(m, n)
    for (let i = 0; i < m; i++) {
        let field = document.getElementById("var" + i);
        field.value = restricts[i].b
    }
    for (let i = 0; i < n; i++) {
        let field = document.getElementById("rest-" + i + "-value")
        field.value = func[i]
    }
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < m; j++) {
            let field = document.getElementById("rest-" + i + "-" + j)
            field.value = restricts[j].values[i];
        }
    }
    for (let i = 0; i < n; i++) {
        let field = document.getElementById("cond-" + i)
        if (i >= restricts.length) field.value = LE
        else if (restricts[i].sign == LE) field.value = GE
        else if (restricts[i].sign == GE) field.value = LE
    }
    modeBox.value = mode;
}

updateHideOpenBlock()
InitTable();
if (GENERATE_SAMPLES) GenerateSimples();
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else if (typeof exports === 'object') {
        factory(require('jquery'));
    } else {
        factory(jQuery);
    }
}(function ($) {
    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
        try {
            s = decodeURIComponent(s.replace(pluses, ' '));
            return config.json ? JSON.parse(s) : s;
        } catch (e) {
        }
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function (key, value, options) {
        if (arguments.length > 1 && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);
            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setTime(+t + days * 864e+5);
            }
            return (document.cookie = [encode(key), '=', stringifyCookieValue(value), options.expires ? '; expires=' + options.expires.toUTCString() : '', options.path ? '; path=' + options.path : '', options.domain ? '; domain=' + options.domain : '', options.secure ? '; secure' : ''].join(''));
        }
        var result = key ? undefined : {};
        var cookies = document.cookie ? document.cookie.split('; ') : [];
        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');
            if (key && key === name) {
                result = read(cookie, value);
                break;
            }
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }
        return result;
    };
    config.defaults = {};
    $.removeCookie = function (key, options) {
        if ($.cookie(key) === undefined) {
            return false;
        }
        $.cookie(key, '', $.extend({}, options, {expires: -1}));
        return !$.cookie(key);
    };
}));

$(document).ready(function (e) {
    var needShow = $.cookie("hideModal");
    if (needShow == null) {
        $(".modal-head span").click(function () {
            $(".modal-wrapper").removeClass("open");
            $.cookie("hideModal", {expires: 1});
        });
        $(document).mouseup(function (e) {
            if ($(".modal-wrapper").has(e.target).length === 0) {
                $(".modal-wrapper").removeClass("open");
                $.cookie("hideModal", {expires: 1});
            }
        });
    }
});
$(document).mouseleave(function (e) {
    if (e.clientY < 0 && $.cookie("hideModal") == null) $(".modal-wrapper").addClass("open");
});