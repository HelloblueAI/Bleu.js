"""
Enhanced tokenizer with advanced NLP features.
"""

import logging
import re
from collections import Counter
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

import spacy
import torch
from torch.nn.utils.rnn import pad_sequence
from transformers.models.auto.tokenization_auto import AutoTokenizer


@dataclass
class TokenizerConfig:
    """Configuration for tokenizer."""

    model_name: str = "bert-base-uncased"
    max_length: int = 512
    padding: str = "max_length"
    truncation: bool = True
    add_special_tokens: bool = True
    return_tensors: str = "pt"
    use_fast: bool = True
    use_spacy: bool = False
    language: str = "en"
    custom_tokens: Optional[List[str]] = None


class EnhancedTokenizer:
    """Enhanced tokenizer with advanced features."""

    def __init__(self, config: TokenizerConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Initialize tokenizers
        self.tokenizer = AutoTokenizer.from_pretrained(
            config.model_name, use_fast=config.use_fast
        )

        if config.use_spacy:
            self.nlp = spacy.load(config.language)

        if config.custom_tokens:
            self._add_custom_tokens(config.custom_tokens)

        self.special_tokens = self._get_special_tokens()

    def _add_custom_tokens(self, custom_tokens: List[str]):
        """Add custom tokens to the tokenizer."""
        new_tokens = []
        for token in custom_tokens:
            if token not in self.tokenizer.get_vocab():
                new_tokens.append(token)

        if new_tokens:
            num_added = self.tokenizer.add_tokens(new_tokens)
            self.logger.info(f"Added {num_added} custom tokens")

    def _get_special_tokens(self) -> Dict[str, str]:
        """Get special tokens mapping."""
        return {
            "pad": self.tokenizer.pad_token,
            "unk": self.tokenizer.unk_token,
            "bos": self.tokenizer.bos_token,
            "eos": self.tokenizer.eos_token,
            "mask": self.tokenizer.mask_token,
            "sep": self.tokenizer.sep_token,
            "cls": self.tokenizer.cls_token,
        }

    def tokenize(
        self, texts: str | List[str], return_tensors: bool = True
    ) -> Dict[str, torch.Tensor]:
        """Tokenize text with advanced features."""
        if isinstance(texts, str):
            texts = [texts]

        # Preprocess texts
        texts = [self._preprocess_text(text) for text in texts]

        # Tokenize
        encodings = self.tokenizer(
            texts,
            max_length=self.config.max_length,
            padding=self.config.padding,
            truncation=self.config.truncation,
            add_special_tokens=self.config.add_special_tokens,
            return_tensors=self.config.return_tensors if return_tensors else None,
        )

        # Add additional features
        if self.config.use_spacy:
            encodings = self._add_linguistic_features(texts, encodings)

        return encodings

    def _preprocess_text(self, text: str) -> str:
        """Preprocess text before tokenization."""
        # Basic cleaning
        text = text.strip()
        text = re.sub(r"\s+", " ", text)

        if self.config.use_spacy:
            doc = self.nlp(text)
            # Lemmatization
            text = " ".join([token.lemma_ for token in doc])

        return text

    def _add_linguistic_features(
        self, texts: List[str], encodings: Dict[str, torch.Tensor]
    ) -> Dict[str, torch.Tensor]:
        """Add linguistic features using spaCy."""
        docs = list(self.nlp.pipe(texts))

        # POS tags
        pos_tags = []
        # Named entities
        ner_tags = []
        # Dependency labels
        dep_labels = []

        for doc in docs:
            # Get POS tags
            doc_pos = [token.pos_ for token in doc]
            pos_tags.append(doc_pos)

            # Get NER tags
            doc_ner = [
                "O" if token.ent_type_ == "" else token.ent_type_ for token in doc
            ]
            ner_tags.append(doc_ner)

            # Get dependency labels
            doc_dep = [token.dep_ for token in doc]
            dep_labels.append(doc_dep)

        # Convert to tensors and add to encodings
        encodings["pos_tags"] = self._convert_features_to_tensors(pos_tags)
        encodings["ner_tags"] = self._convert_features_to_tensors(ner_tags)
        encodings["dep_labels"] = self._convert_features_to_tensors(dep_labels)

        return encodings

    def _convert_features_to_tensors(self, features: List[List[str]]) -> torch.Tensor:
        """Convert linguistic features to tensors."""
        # Create vocabulary for features
        vocab = Counter()
        for seq in features:
            vocab.update(seq)

        # Convert to indices
        indexed_features = []
        for seq in features:
            indexed_features.append([vocab[feature] for feature in seq])

        # Pad sequences
        padded_features = pad_sequence(
            [torch.tensor(seq) for seq in indexed_features],
            batch_first=True,
            padding_value=0,
        )

        return padded_features

    def decode(
        self, token_ids: torch.Tensor, skip_special_tokens: bool = True
    ) -> List[str]:
        """Decode token IDs to text."""
        return self.tokenizer.batch_decode(
            token_ids, skip_special_tokens=skip_special_tokens
        )

    def get_vocab_size(self) -> int:
        """Get vocabulary size."""
        return len(self.tokenizer)

    def save_tokenizer(self, path: str):
        """Save tokenizer to disk."""
        self.tokenizer.save_pretrained(path)

    def load_tokenizer(self, path: str):
        """Load tokenizer from disk."""
        self.tokenizer = AutoTokenizer.from_pretrained(path)

    def get_token_type_ids(self, text_pairs: List[Tuple[str, str]]) -> torch.Tensor:
        """Get token type IDs for text pairs."""
        encodings = self.tokenizer(
            text_pairs,
            max_length=self.config.max_length,
            padding=self.config.padding,
            truncation=self.config.truncation,
            add_special_tokens=self.config.add_special_tokens,
            return_tensors=self.config.return_tensors,
        )
        return encodings["token_type_ids"]

    def get_attention_mask(self, texts: str | List[str]) -> torch.Tensor:
        """Get attention mask for texts."""
        encodings = self.tokenize(texts)
        return encodings["attention_mask"]
