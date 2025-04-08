import subprocess
import pytest
from ..config import SSH_BASE, SERVICE_COMMANDS, LOG_PATHS

@pytest.mark.ec2
class TestEC2Services:
    def run_ssh_command(self, command):
        """Helper function to run SSH commands"""
        full_command = f"{SSH_BASE} '{command}'"
        result = subprocess.run(full_command, shell=True, capture_output=True, text=True)
        return result

    def test_cloudwatch_agent_status(self):
        """Test if CloudWatch agent is running"""
        result = self.run_ssh_command(SERVICE_COMMANDS['cloudwatch'])
        assert result.returncode == 0
        assert 'active (running)' in result.stdout.lower()

    def test_nginx_status(self):
        """Test if Nginx is running"""
        result = self.run_ssh_command(SERVICE_COMMANDS['nginx'])
        assert result.returncode == 0
        assert 'active (running)' in result.stdout.lower()

    def test_cloudwatch_logs(self):
        """Test CloudWatch agent logs"""
        result = self.run_ssh_command(f"sudo cat {LOG_PATHS['cloudwatch']}")
        assert result.returncode == 0
        assert len(result.stdout) > 0

    def test_cloud_init_logs(self):
        """Test cloud-init logs"""
        result = self.run_ssh_command(f"sudo tail -n 50 {LOG_PATHS['cloud_init']}")
        assert result.returncode == 0
        assert len(result.stdout) > 0

    def test_file_transfer(self, tmp_path):
        """Test SCP file transfer"""
        # Create a test file
        test_file = tmp_path / "test.txt"
        test_file.write_text("test content")
        
        # Copy file to EC2
        scp_command = f"scp -i bleu-js-key.pem {test_file} ec2-user@44.245.223.189:~/"
        result = subprocess.run(scp_command, shell=True, capture_output=True, text=True)
        assert result.returncode == 0
        
        # Verify file exists on EC2
        result = self.run_ssh_command("ls ~/test.txt")
        assert result.returncode == 0
        assert "test.txt" in result.stdout 