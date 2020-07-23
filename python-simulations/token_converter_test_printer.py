from token_converter import TokenConverter
from token_converter_test import TokenConverterTest
from token_converter_test import TokenConverterTestResult


def transform_to_readable(number):
    return number / (10 ** 18)


class TokenConverterTestPrinter(object):

    def __init__(self, token_weight: int, token_balance: int, eth_balance: int):
        self.general_converter_test = TokenConverterTest(token_weight, token_balance, eth_balance, TokenConverter.GENERAL_PRICING)
        self.specific_converter_test = TokenConverterTest(token_weight, token_balance, eth_balance, TokenConverter.SPECIFIC_PRICING)

    def print_results(self, orders_number: int, test_strategy: str, eth_spent: int, tokens_spent: int):
        generator = self.general_converter_test.test
        for result in generator(orders_number, test_strategy, eth_spent, tokens_spent):
            self.get_print_method(result.order_type)(result)

    def compare_pricing_methods(self, orders_number: int, test_strategy: str, eth_spent: int, tokens_spent: int):
        general_generator = self.general_converter_test.test
        specific_generator = self.specific_converter_test.test

        general_results = [result for result in general_generator(orders_number, test_strategy, eth_spent, tokens_spent)]
        specific_results = [result for result in specific_generator(orders_number, test_strategy, eth_spent, tokens_spent)]

        for general_result, specific_result in zip(general_results, specific_results):
            print("==========================================")
            print(f"----            GENERAL              ----")
            print("==========================================")
            self.get_print_method(general_result.order_type)(general_result)
            print("==========================================")
            print(f"----            SPECIFIC             ----")
            print("==========================================")
            self.get_print_method(specific_result.order_type)(specific_result)


    @staticmethod
    def print_buy_info(result: TokenConverterTestResult):
        tokens_bought = transform_to_readable(result.tokens_transacted)
        eth_spent = transform_to_readable(result.eth_transacted)
        token_balance = transform_to_readable(result.token_balance)
        eth_balance = transform_to_readable(result.eth_balance)
        print("==========================================")
        print(f"      ---- BUY ORDER {result.order_number}  ----")
        print("==========================================")
        print(f" - Tokens Bought: {tokens_bought}")
        print(f" - ETH spent: {eth_spent}")
        print(f" - Effective Price: {result.effective_price}")
        print(f" - Token balance: {token_balance}")
        print(f" - ETH balance: {eth_balance}")
        print("==========================================")

    @staticmethod
    def print_sell_info(result: TokenConverterTestResult):
        tokens_sold = transform_to_readable(result.tokens_transacted)
        eth_received = transform_to_readable(result.eth_transacted)
        token_balance = transform_to_readable(result.token_balance)
        eth_balance = transform_to_readable(result.eth_balance)
        print("==========================================")
        print(f"     ---- SELL ORDER {result.order_number} ----")
        print("==========================================")
        print(f" - Tokens Sold: {tokens_sold}")
        print(f" - ETH received: {eth_received}")
        print(f" - Effective Price: {result.effective_price}")
        print(f" - Token balance: {token_balance}")
        print(f" - ETH balance: {eth_balance}")
        print("==========================================")

    def get_print_method(self, key: str):
        methods = {
            'buy': self.print_buy_info,
            'sell': self.print_sell_info
        }
        return methods.get(key, 'No such method is defined')


printer = TokenConverterTestPrinter(900000, 100000, 1)
printer.compare_pricing_methods(
    orders_number=1000,
    test_strategy='successive',
    eth_spent=1,
    tokens_spent=10
)
