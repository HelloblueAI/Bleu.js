"""
Enhanced text processor with advanced NLP features.
"""

import logging
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Union

import torch
from sentence_transformers import SentenceTransformer
from sklearn.feature_extraction.text import TfidfVectorizer
from transformers.models.auto.modeling_auto import AutoModel

from .tokenizer import EnhancedTokenizer, TokenizerConfig


@dataclass
class TextProcessorConfig:
    """Configuration for text processor."""

    model_name: str = "bert-base-uncased"
    embedding_dim: int = 768
    pooling_strategy: str = "mean"
    use_tfidf: bool = True
    use_sentence_transformers: bool = True
    sentence_transformer_model: str = "all-MiniLM-L6-v2"
    max_length: int = 512
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    batch_size: int = 32
    use_attention_pooling: bool = True
    tokenizer_config: Optional[TokenizerConfig] = None


class EnhancedTextProcessor:
    """Enhanced text processor with advanced features."""

    def __init__(self, config: TextProcessorConfig):
        self.config = config
        self.logger = logging.getLogger(__name__)

        # Initialize tokenizer
        tokenizer_config = config.tokenizer_config or TokenizerConfig(
            model_name=config.model_name, max_length=config.max_length
        )
        self.tokenizer = EnhancedTokenizer(tokenizer_config)

        # Initialize models
        self.model = AutoModel.from_pretrained(config.model_name).to(config.device)

        if config.use_sentence_transformers:
            self.sentence_transformer = SentenceTransformer(
                config.sentence_transformer_model
            ).to(config.device)

        if config.use_tfidf:
            self.tfidf = TfidfVectorizer(max_features=10000, stop_words="english")

        if config.use_attention_pooling:
            self.attention_pooling = torch.nn.Linear(config.embedding_dim, 1).to(
                config.device
            )

    def process_text(
        self,
        texts: Union[str, List[str]],
        return_embeddings: bool = True,
        return_features: bool = True,
    ) -> Dict[str, torch.Tensor]:
        """Process text with advanced features."""
        if isinstance(texts, str):
            texts = [texts]

        # Tokenize texts
        encodings = self.tokenizer.tokenize(texts)

        results = {}

        # Get embeddings
        if return_embeddings:
            embeddings = self._get_embeddings(encodings)
            results["embeddings"] = embeddings

        # Get additional features
        if return_features:
            features = self._get_features(texts)
            results.update(features)

        return results

    def _get_embeddings(self, encodings: Dict[str, torch.Tensor]) -> torch.Tensor:
        """Get text embeddings using transformer model."""
        # Move inputs to device
        input_ids = encodings["input_ids"].to(self.config.device)
        attention_mask = encodings["attention_mask"].to(self.config.device)

        # Process in batches
        embeddings = []
        for i in range(0, len(input_ids), self.config.batch_size):
            batch_input_ids = input_ids[i : i + self.config.batch_size]
            batch_attention_mask = attention_mask[i : i + self.config.batch_size]

            with torch.no_grad():
                outputs = self.model(
                    input_ids=batch_input_ids, attention_mask=batch_attention_mask
                )

            # Get hidden states
            hidden_states = outputs.last_hidden_state

            # Apply pooling
            if self.config.use_attention_pooling:
                # Attention pooling
                attention_weights = self.attention_pooling(hidden_states)
                attention_weights = torch.softmax(attention_weights, dim=1)
                batch_embeddings = torch.sum(hidden_states * attention_weights, dim=1)
            else:
                # Mean pooling
                if self.config.pooling_strategy == "mean":
                    batch_embeddings = torch.mean(hidden_states, dim=1)
                # Max pooling
                elif self.config.pooling_strategy == "max":
                    batch_embeddings = torch.max(hidden_states, dim=1)[0]
                # CLS token
                else:
                    batch_embeddings = hidden_states[:, 0]

            embeddings.append(batch_embeddings)

        # Concatenate all batches
        embeddings = torch.cat(embeddings, dim=0)

        return embeddings

    def _get_features(self, texts: List[str]) -> Dict[str, torch.Tensor]:
        """Get additional text features."""
        features = {}

        # Get TF-IDF features
        if self.config.use_tfidf:
            tfidf_features = self.tfidf.fit_transform(texts).toarray()
            features["tfidf"] = torch.tensor(
                tfidf_features, dtype=torch.float32, device=self.config.device
            )

        # Get sentence transformer embeddings
        if self.config.use_sentence_transformers:
            with torch.no_grad():
                sentence_embeddings = self.sentence_transformer.encode(
                    texts,
                    batch_size=self.config.batch_size,
                    show_progress_bar=False,
                    convert_to_tensor=True,
                    device=self.config.device,
                )
            features["sentence_embeddings"] = sentence_embeddings

        return features

    def get_similarity(
        self,
        texts1: Union[str, List[str]],
        texts2: Union[str, List[str]],
        metric: str = "cosine",
    ) -> torch.Tensor:
        """Calculate similarity between texts."""
        # Get embeddings
        embeddings1 = self.process_text(texts1)["embeddings"]
        embeddings2 = self.process_text(texts2)["embeddings"]

        # Calculate similarity
        if metric == "cosine":
            similarity = torch.nn.functional.cosine_similarity(
                embeddings1.unsqueeze(1), embeddings2.unsqueeze(0), dim=2
            )
        elif metric == "euclidean":
            similarity = torch.cdist(embeddings1, embeddings2)
        else:
            raise ValueError(f"Unsupported similarity metric: {metric}")

        return similarity

    def classify_texts(
        self, texts: Union[str, List[str]], labels: List[str]
    ) -> Tuple[List[str], torch.Tensor]:
        """Classify texts using zero-shot classification."""
        # Get text embeddings
        text_embeddings = self.process_text(texts)["embeddings"]

        # Get label embeddings
        label_embeddings = self.process_text(labels)["embeddings"]

        # Calculate similarities
        similarities = self.get_similarity(texts, labels)

        # Get predicted labels and probabilities
        probs = torch.softmax(similarities, dim=1)
        predicted_indices = torch.argmax(probs, dim=1)
        predicted_labels = [labels[i] for i in predicted_indices]

        return predicted_labels, probs

    def save_processor(self, path: str):
        """Save processor to disk."""
        # Save models
        self.model.save_pretrained(f"{path}/transformer")
        if self.config.use_sentence_transformers:
            self.sentence_transformer.save(f"{path}/sentence_transformer")

        # Save tokenizer
        self.tokenizer.save_tokenizer(f"{path}/tokenizer")

        # Save attention pooling if used
        if self.config.use_attention_pooling:
            torch.save(
                self.attention_pooling.state_dict(), f"{path}/attention_pooling.pt"
            )

    def load_processor(self, path: str):
        """Load processor from disk."""
        # Load models
        self.model = AutoModel.from_pretrained(f"{path}/transformer")
        if self.config.use_sentence_transformers:
            self.sentence_transformer = SentenceTransformer(
                f"{path}/sentence_transformer"
            )

        # Load tokenizer
        self.tokenizer.load_tokenizer(f"{path}/tokenizer")

        # Load attention pooling if used
        if self.config.use_attention_pooling:
            self.attention_pooling.load_state_dict(
                torch.load(f"{path}/attention_pooling.pt")
            )
