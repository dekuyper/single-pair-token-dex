from token_converter import TokenConverter


class TokenConverterTestResult(object):
    def __init__(self, eth_transacted, tokens_transacted, effective_price, order_type: str, order_number: int,
                 token_balance, eth_balance):
        self.eth_transacted = eth_transacted
        self.tokens_transacted = tokens_transacted
        self.effective_price = effective_price
        self.order_type = order_type
        self.order_number = order_number
        self.token_balance = token_balance
        self.eth_balance = eth_balance


class TokenConverterTest(object):
    orders_number: int
    precision = 10 ** 18
    eth_spent: int
    tokens_spent: int

    def __init__(self, token_weight: int, token_balance: int, eth_balance: int, pricing_method: str):
        self.strategy = None
        token_weight, eth_weight = TokenConverterTest.get_weights(token_weight)
        token_balance = token_balance * TokenConverterTest.precision
        eth_balance = eth_balance * TokenConverterTest.precision
        self.converter = TokenConverter(token_weight, token_balance, eth_weight, eth_balance, pricing_method)
        self.token_connector = self.converter.token_connector
        self.eth_connector = self.converter.eth_connector

    def test(self, orders_number: int, test_strategy='alternate', eth_spent=10, tokens_spent=100):
        self.eth_spent = eth_spent * self.precision
        self.tokens_spent = tokens_spent * self.precision
        self.orders_number = orders_number + 1
        self.strategy = self.get_strategy_method(test_strategy)
        yield from self.strategy()

    def just_buy_strategy(self):
        for order_number in range(1, self.orders_number):
            yield self.place_buy_order(self.eth_spent, order_number)

    def just_sell_strategy(self):
        for order_number in range(1, self.orders_number):
            yield self.place_sell_order(self.tokens_spent, order_number)

    def successive_orders_strategy(self):
        orders_number = int(self.orders_number / 2)
        tokens_received = []
        for order_number in range(1, orders_number):
            result = self.place_buy_order(self.eth_spent, order_number)
            tokens_received.append(result.tokens_transacted)
            yield result
        tokens_received.reverse()
        for index, tokens_spent in enumerate(tokens_received):
            yield self.place_sell_order(tokens_spent, index + orders_number)

    def alternated_orders_strategy(self):
        for order_number in range(1, self.orders_number):
            if order_number % 2 == 0:
                yield self.place_sell_order(self.tokens_spent, order_number)
            else:
                yield self.place_buy_order(self.eth_spent, order_number)

    def circulate_same_amount_strategy(self):
        eth_spent = self.eth_spent
        tokens_spent = self.tokens_spent
        for order_number in range(1, self.orders_number):
            if order_number % 2 == 0:
                result = self.place_sell_order(tokens_spent, order_number)
                eth_spent = result.eth_transacted
                yield result
            else:
                result = self.place_buy_order(eth_spent, order_number)
                tokens_spent = result.tokens_transacted
                yield result

    def place_buy_order(self, eth_spent: int, order_number: int):
        tokens_received, effective_price = self.converter.buy(eth_spent)
        return TokenConverterTestResult(
            eth_spent,
            tokens_received,
            effective_price,
            'buy',
            order_number,
            self.token_connector.balance,
            self.eth_connector.balance
        )

    def place_sell_order(self, tokens_spent: int, order_number: int):
        eth_received, effective_price = self.converter.sell(tokens_spent)
        return TokenConverterTestResult(
            eth_received,
            tokens_spent,
            effective_price,
            'sell',
            order_number,
            self.token_connector.balance,
            self.eth_connector.balance
        )

    def get_strategy_method(self, key: str):
        strategies = {
            'alternate': self.alternated_orders_strategy,
            'successive': self.successive_orders_strategy,
            'just_buy': self.just_buy_strategy,
            'just_sell': self.just_sell_strategy,
            'circulate': self.circulate_same_amount_strategy
        }
        return strategies.get(key, 'Invalid strategy')

    @staticmethod
    def get_weights(token):
        one_million = 10 ** 6
        assert token < one_million
        eth = one_million - token
        return token, eth
