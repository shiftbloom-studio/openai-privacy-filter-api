"""Tests for privacy filter payload validators."""
import unittest
from privacy_filter.validators import validate_text_payload, MAX_PAYLOAD_CHAR_LENGTH

class TestValidators(unittest.TestCase):
    def test_valid_payload(self):
        valid, err = validate_text_payload("Hello world, clean prompt.")
        self.assertTrue(valid)
        self.assertEqual(err, "")

    def test_empty_payload(self):
        valid, err = validate_text_payload("   ")
        self.assertFalse(valid)
        self.assertIn("empty", err)

    def test_oversized_payload(self):
        huge_str = "a" * (MAX_PAYLOAD_CHAR_LENGTH + 10)
        valid, err = validate_text_payload(huge_str)
        self.assertFalse(valid)
        self.assertIn("exceeds", err)

if __name__ == "__main__":
    unittest.main()
