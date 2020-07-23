import matplotlib.pyplot as plt

from token_converter import TokenConverter
from token_converter_test import TokenConverterTest


def transform_to_readable(number):
    return number / (10 ** 18)


class TokenConverterTestPlotter(object):
    token_balances = []
    eth_balances = []
    token_price = []
    order_number = []

    def __init__(self, token_weight: int, token_balance: int, eth_balance: int, pricing):
        self.pricing_method = pricing
        self.converter_test = TokenConverterTest(token_weight, token_balance, eth_balance, pricing)
        self.token_connector = self.converter_test.converter.token_connector
        self.eth_connector = self.converter_test.converter.eth_connector

    def plot(self, orders_number: int, test_strategy: str, eth_spent, tokens_spent):
        generator = self.converter_test.test
        for result in generator(orders_number, test_strategy, eth_spent, tokens_spent):
            self.token_balances.append(transform_to_readable(self.token_connector.balance))
            self.eth_balances.append(transform_to_readable(self.eth_connector.balance))
            self.token_price.append(result.effective_price)
            self.order_number.append(result.order_number)

        price_min = min(self.token_price)
        print(price_min)
        plt.plot(self.order_number, self.token_price)
        plt.xlim(0)
        # plt.plot(self.eth_balances, self.token_prices, label='ETH balance')
        plt.xlabel('orders')
        plt.ylabel('Price')
        plt.title(f'Price Evolution. Test Strategy: {test_strategy}. Pricing method: {self.pricing_method}')
        # plt.legend()
        plt.show()


plotter = TokenConverterTestPlotter(token_weight=900000, token_balance=100000, eth_balance=1, pricing=TokenConverter.SPECIFIC_PRICING)
plotter.plot(
    orders_number=200,
    test_strategy='just_buy',
    eth_spent=1,
    tokens_spent=1
)
