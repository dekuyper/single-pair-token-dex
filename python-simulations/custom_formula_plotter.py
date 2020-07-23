import matplotlib.pyplot as plt


class CustomFormulaConverter(object):
    def __init__(self):
        """
        sf: Start funding
        tb: Token balance
        eb: Ether balance
        p: Start price
        """
        self.inf = self.tb = 100000
        self.eb = 100
        self.p = 0.00007058

    def delta(self):
        return self.inf / self.tb

    def ap(self):
        return self.p * self.delta()

    def buy_der(self, q):
        return q / (self.p * self.inf)

    def sell_der(self, q):
        return (self.p * q * self.inf) / (self.tb ** 2)

    def buy(self, q):
        r = (q * self.tb) / ((self.p * self.inf) + q)
        # r = q / (self.ap() * (1 + self.buy_der(q)))
        self.sub_tb(r)
        self.add_eb(q)
        return r

    def sell(self, q):
        r = (q * self.p * self.inf) / (self.tb + q)
        # r = (q * self.ap()) / (1 + self.sell_der(q))
        self.add_tb(q)
        self.sub_eb(r)
        return r

    def add_tb(self, q):
        self.tb += q

    def sub_tb(self, q):
        self.tb -= q

    def add_eb(self, q):
        self.eb += q

    def sub_eb(self, q):
        self.eb -= q


def buy_ep(q, r):
    return q / r

def sell_ep(q, r):
    return r / q


def plot(i, tt='buy'):
    prices = []
    balances = []
    conv = CustomFormulaConverter()
    iter = range(1, i + 1)
    order_t = {'buy': conv.buy, 'sell': conv.sell}
    eps = {'buy': buy_ep, 'sell': sell_ep}
    sell_coins = {'buy': 'ETH', 'sell': 'tokens'}
    sell_coin = sell_coins.get(tt)
    order = order_t.get(tt)
    epf = eps.get(tt)
    q = 1
    for _ in iter:
        r = order(q)
        ep = epf(q, r)
        prices.append(ep)
        balances.append(conv.tb)

    bmin, bmax = min(balances), max(balances)
    pmin, pmax = min(prices), max(prices)

    plt.subplot(2, 1, 1)
    plt.plot(iter, prices, '.-')
    plt.title(f'Price: Min: {pmin}; Max: {pmax}')
    plt.suptitle(f'{i} {tt} orders of {q} {sell_coin}')
    plt.xlabel('Orders')
    plt.ylabel('Price')
    plt.grid(True)
    plt.subplot(2, 1, 2)
    plt.subplots_adjust(hspace=0.5)
    plt.plot(iter, balances, '.-')
    plt.title('Token Balance: '
              f'Min: {bmin}; Max: {bmax}')
    plt.xlabel('Orders')
    plt.ylabel(f'Token Balance')
    plt.grid(True)
    # plt.show()

def successive(q):
    conv = CustomFormulaConverter()
    tokens = conv.buy(q)
    print(tokens)
    eth = conv.sell(tokens)
    print(eth)

successive(1)